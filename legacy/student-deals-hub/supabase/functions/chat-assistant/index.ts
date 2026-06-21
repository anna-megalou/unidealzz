// Unidealz AI Student Deals Assistant
// Streams responses via Lovable AI Gateway and is grounded with live offers
// + the user's preferences and saved/claimed activity.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface PageContext {
  path?: string;
  offerId?: string;
  filters?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pageContext } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      pageContext?: PageContext;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identify the user from the bearer token (optional — anon users can chat too).
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId: string | null = null;
    if (authHeader) {
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    // Fetch grounding data in parallel
    const [offersRes, categoriesRes, prefsRes, savedRes, claimedRes, profileRes, currentOfferRes] =
      await Promise.all([
        admin
          .from("offers")
          .select("id,title,description,discount_label,discount_percent,featured,brand:brands(name),category:categories(name,slug)")
          .eq("active", true)
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(40),
        admin.from("categories").select("name,slug").order("name"),
        userId
          ? admin.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
        userId
          ? admin
              .from("saved_offers")
              .select("offer:offers(title,brand:brands(name),category:categories(name))")
              .eq("user_id", userId)
              .limit(10)
          : Promise.resolve({ data: [] }),
        userId
          ? admin
              .from("claimed_offers")
              .select("offer:offers(title,brand:brands(name),category:categories(name))")
              .eq("user_id", userId)
              .limit(10)
          : Promise.resolve({ data: [] }),
        userId
          ? admin
              .from("student_profiles")
              .select("verification_status, university:universities(name)")
              .eq("user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        pageContext?.offerId
          ? admin
              .from("offers")
              .select("id,title,description,discount_label,terms,brand:brands(name),category:categories(name,slug)")
              .eq("id", pageContext.offerId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    const offers = (offersRes as any).data ?? [];
    const categories = (categoriesRes as any).data ?? [];
    const prefs = (prefsRes as any).data ?? null;
    const saved = (savedRes as any).data ?? [];
    const claimed = (claimedRes as any).data ?? [];
    const studentProfile = (profileRes as any).data ?? null;
    const currentOffer = (currentOfferRes as any).data ?? null;

    const compactOffers = offers.map((o: any) => ({
      id: o.id,
      title: o.title,
      brand: o.brand?.name,
      category: o.category?.name,
      discount: o.discount_label || (o.discount_percent ? `${o.discount_percent}% off` : null),
      featured: o.featured,
      summary: (o.description ?? "").slice(0, 160),
    }));

    const systemPrompt = `You are the Unidealz Student Deals Assistant — a friendly, sharp helper for university students in Greece using the Unidealz platform.

YOUR ROLE
- Help students discover the best student offers, answer FAQs about the platform, and personalize recommendations.
- Be concise, warm, student-friendly. Default to short replies. Use markdown lists when recommending multiple offers.
- Never invent offers, brands, prices or codes. Only use what's in the LIVE DATA below.
- If unsure or out of scope, suggest visiting /contact (Support) and offer to prefill the issue.

PLATFORM FAQ (use these to answer naturally)
- Student verification: Sign up, then submit your university + student email at /student-hub/account. If your email domain matches your university, you're auto-approved; otherwise an admin reviews it.
- Claiming an offer: Open the offer page → click "Claim" → use the revealed code or follow the redirect.
- Saved offers: Heart icon on any offer card. View them at /student-hub/saved.
- StudentHub: Your personal dashboard at /student-hub — saved deals, claimed offers, preferences, support.
- Login / Signup: /login and /signup. Google sign-in is supported.
- Support: /contact opens a support form; tickets go to the Unidealz operations team.
- Unavailable offers: Offers may expire or be paused by the brand. Check expiry on the offer page.
- Categories: ${categories.map((c: any) => c.name).join(", ")}.

PAGE CONTEXT
- Current path: ${pageContext?.path ?? "unknown"}
${currentOffer ? `- Current offer: ${currentOffer.title} by ${currentOffer.brand?.name} (${currentOffer.discount_label ?? ""}). ${currentOffer.description ?? ""}` : ""}

USER CONTEXT
- Signed in: ${userId ? "yes" : "no"}
- Verification: ${studentProfile?.verification_status ?? "n/a"}${studentProfile?.university?.name ? ` (${studentProfile.university.name})` : ""}
- Preferences: ${prefs ? JSON.stringify({ cats: prefs.favorite_categories, brands: prefs.favorite_brands, budget: prefs.budget_preference, mode: prefs.online_vs_instore }) : "none collected yet"}
- Saved offers: ${saved.map((s: any) => s.offer?.title).filter(Boolean).join(", ") || "none"}
- Claimed offers: ${claimed.map((c: any) => c.offer?.title).filter(Boolean).join(", ") || "none"}

LIVE OFFERS (use only these for recommendations)
${JSON.stringify(compactOffers)}

RECOMMENDATION RULES
- Prefer offers matching the user's favorite_categories / favorite_brands.
- On an offer detail page, suggest 2-3 similar offers from the same category (different brand if possible).
- On the Offers page, surface featured + trending picks.
- Always cite the brand name. Keep lists to 3-5 items max. Use this markdown format for each:
  **Brand — Title** — discount. _Why it fits you._

ESCALATION
- If the user has a complex problem (account issue, brand complaint, refund), point to /contact and say a teammate will help.

Keep responses under ~120 words unless the user explicitly asks for detail.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact the Unidealz team." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
