import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { COLLECTIONS } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { admin, db } from '../admin';
import { SITE_URL } from '../services/email/constants';
import { sendTransactionalEmail } from '../services/email/emailSender';

export const onOfferCreated = onDocumentCreated(
  `${COLLECTIONS.offers}/{offerId}`,
  async (event) => {
    const offer = event.data?.data();
    const offerId = event.params.offerId;

    if (!offer || offer.active === false) {
      return;
    }

    const brandId = offer.brandId as string | undefined;
    if (!brandId) {
      return;
    }

    const brandDoc = await db.collection(COLLECTIONS.brands).doc(brandId).get();
    const brandName = brandDoc.data()?.name ?? '';

    const favoritesSnap = await db.collection(COLLECTIONS.favorites).get();
    const userIds = new Set<string>();

    for (const fav of favoritesSnap.docs) {
      const favData = fav.data();
      const favOfferId = favData.offerId as string;
      if (!favOfferId) continue;
      const favOffer = await db.collection(COLLECTIONS.offers).doc(favOfferId).get();
      if (favOffer.data()?.brandId === brandId) {
        userIds.add(favData.userId as string);
      }
    }

    if (userIds.size === 0) {
      logger.info('onOfferCreated: no matching users', { offerId });
      return;
    }

    let sent = 0;
    let skipped = 0;

    for (const userId of userIds) {
      const settingsSnap = await db
        .collection(COLLECTIONS.userSettings)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const settings = settingsSnap.empty ? null : settingsSnap.docs[0].data();
      if (
        settings?.emailNotifications === false ||
        settings?.favoriteBrandAlertsOptIn === false
      ) {
        skipped++;
        continue;
      }

      const alreadySent = await db
        .collection(COLLECTIONS.favoriteBrandAlertsSent)
        .where('userId', '==', userId)
        .where('offerId', '==', offerId)
        .limit(1)
        .get();

      if (!alreadySent.empty) {
        skipped++;
        continue;
      }

      let email: string | undefined;
      try {
        const user = await admin.auth().getUser(userId);
        email = user.email;
      } catch {
        skipped++;
        continue;
      }

      if (!email) {
        skipped++;
        continue;
      }

      const profileSnap = await db
        .collection(COLLECTIONS.profiles)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      const displayName = profileSnap.empty
        ? undefined
        : (profileSnap.docs[0].data().displayName as string | undefined);

      const idempotencyKey = `fav-brand-alert-${userId}-${offerId}`;

      try {
        const result = await sendTransactionalEmail({
          templateName: 'favorite-brand-new-offer',
          recipientEmail: email,
          idempotencyKey,
          templateData: {
            name: displayName,
            offers: [
              {
                title: offer.title,
                brandName,
                discountLabel: offer.discountLabel ?? undefined,
                url: `${SITE_URL}/offers/${offerId}`,
              },
            ],
          },
        });

        if (!result.success) {
          skipped++;
          continue;
        }

        await db.collection(COLLECTIONS.favoriteBrandAlertsSent).add({
          userId,
          offerId,
          sentAt: FieldValue.serverTimestamp(),
        });
        sent++;
      } catch (err) {
        logger.error('onOfferCreated send failed', { userId, offerId, err });
      }
    }

    logger.info('onOfferCreated alerts complete', { offerId, sent, skipped });
  }
);
