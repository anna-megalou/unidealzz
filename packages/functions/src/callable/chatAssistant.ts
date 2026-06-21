import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import OpenAI from 'openai';
import type { DocumentData } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config';
import { db } from '../admin';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PageContext {
  path?: string;
  offerId?: string;
  filters?: Record<string, unknown>;
}

interface ChatAssistantInput {
  messages?: ChatMessage[];
  pageContext?: PageContext;
}

export const chatAssistant = onCall(CALLABLE_CONFIG, async (request) => {
  const data = (request.data ?? {}) as ChatAssistantInput;
  const messages = data.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpsError('invalid-argument', 'messages required');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'OpenAI is not configured');
  }

  const userId = request.auth?.uid ?? null;
  const pageContext = data.pageContext;

  const [offersSnap, categoriesSnap, prefsSnap, savedSnap, claimedSnap, profileSnap, currentOfferSnap] =
    await Promise.all([
      db
        .collection(COLLECTIONS.offers)
        .where('active', '==', true)
        .orderBy('featured', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(40)
        .get(),
      db.collection(COLLECTIONS.categories).orderBy('name').get(),
      userId
        ? db
            .collection(COLLECTIONS.userPreferences)
            .where('userId', '==', userId)
            .limit(1)
            .get()
        : Promise.resolve(null),
      userId
        ? db
            .collection(COLLECTIONS.savedOffers)
            .where('userId', '==', userId)
            .limit(10)
            .get()
        : Promise.resolve(null),
      userId
        ? db
            .collection(COLLECTIONS.claimedOffers)
            .where('userId', '==', userId)
            .limit(10)
            .get()
        : Promise.resolve(null),
      userId
        ? db
            .collection(COLLECTIONS.studentProfiles)
            .where('userId', '==', userId)
            .limit(1)
            .get()
        : Promise.resolve(null),
      pageContext?.offerId
        ? db.collection(COLLECTIONS.offers).doc(pageContext.offerId).get()
        : Promise.resolve(null),
    ]);

  const brandIds = new Set<string>();
  const categoryIds = new Set<string>();
  offersSnap.docs.forEach((doc) => {
    const d = doc.data();
    if (d.brandId) brandIds.add(d.brandId as string);
    if (d.categoryId) categoryIds.add(d.categoryId as string);
  });

  const [brandsMap, categoriesMap] = await Promise.all([
    fetchDocsByIds(COLLECTIONS.brands, [...brandIds]),
    fetchDocsByIds(COLLECTIONS.categories, [...categoryIds]),
  ]);

  const categories = categoriesSnap.docs.map((doc) => ({
    name: doc.data().name,
    slug: doc.data().slug,
  }));

  const compactOffers = offersSnap.docs.map((doc) => {
    const o = doc.data();
    const brand = brandsMap.get(o.brandId as string);
    const category = categoriesMap.get(o.categoryId as string);
    return {
      id: doc.id,
      title: o.title,
      brand: brand?.name,
      category: category?.name,
      discount: o.discountLabel || (o.discountPercent ? `${o.discountPercent}% off` : null),
      featured: o.featured,
      summary: ((o.description as string) ?? '').slice(0, 160),
    };
  });

  let currentOffer: Record<string, unknown> | null = null;
  if (currentOfferSnap?.exists) {
    const o = currentOfferSnap.data()!;
    currentOffer = {
      title: o.title,
      brand: brandsMap.get(o.brandId as string)?.name,
      discount_label: o.discountLabel,
      description: o.description,
    };
  }

  const prefs = prefsSnap && !prefsSnap.empty ? prefsSnap.docs[0].data() : null;
  const studentProfile =
    profileSnap && !profileSnap.empty ? profileSnap.docs[0].data() : null;

  const systemPrompt = buildSystemPrompt({
    categories,
    pageContext,
    currentOffer,
    userId,
    prefs,
    studentProfile,
    compactOffers,
    savedCount: savedSnap?.size ?? 0,
    claimedCount: claimedSnap?.size ?? 0,
  });

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    return { content };
  } catch (err) {
    logger.error('chatAssistant OpenAI error', { err });
    const status = (err as { status?: number }).status;
    if (status === 429) {
      throw new HttpsError('resource-exhausted', 'Too many requests, please try again later.');
    }
    throw new HttpsError('internal', 'AI service error');
  }
});

async function fetchDocsByIds(
  collection: string,
  ids: string[]
): Promise<Map<string, DocumentData>> {
  const map = new Map<string, DocumentData>();
  await Promise.all(
    ids.map(async (id) => {
      const doc = await db.collection(collection).doc(id).get();
      if (doc.exists) map.set(id, doc.data()!);
    })
  );
  return map;
}

function buildSystemPrompt(ctx: {
  categories: Array<{ name: unknown; slug: unknown }>;
  pageContext?: PageContext;
  currentOffer: Record<string, unknown> | null;
  userId: string | null;
  prefs: DocumentData | null;
  studentProfile: DocumentData | null;
  compactOffers: unknown[];
  savedCount: number;
  claimedCount: number;
}): string {
  const categoryNames = ctx.categories.map((c) => c.name).join(', ');
  return `You are the Unidealz Student Deals Assistant — a friendly helper for university students in Greece.

YOUR ROLE
- Help students discover offers, answer FAQs, and personalize recommendations.
- Be concise and warm. Never invent offers — only use LIVE DATA below.
- If unsure, suggest visiting /contact for support.

PLATFORM FAQ
- Student verification: Submit university + student email at /student-hub/account.
- Claiming: Open offer → click Claim → use code or redirect.
- Saved offers: Heart icon; view at /student-hub/saved.
- Categories: ${categoryNames}.

PAGE CONTEXT
- Current path: ${ctx.pageContext?.path ?? 'unknown'}
${ctx.currentOffer ? `- Current offer: ${ctx.currentOffer.title} by ${ctx.currentOffer.brand}` : ''}

USER CONTEXT
- Signed in: ${ctx.userId ? 'yes' : 'no'}
- Verification: ${ctx.studentProfile?.verificationStatus ?? 'n/a'}
- Preferences: ${ctx.prefs ? JSON.stringify(ctx.prefs) : 'none'}
- Saved offers count: ${ctx.savedCount}
- Claimed offers count: ${ctx.claimedCount}

LIVE OFFERS
${JSON.stringify(ctx.compactOffers)}

Keep responses under ~120 words unless the user asks for detail.`;
}
