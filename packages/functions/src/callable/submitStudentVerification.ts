import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { COLLECTIONS } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { AUTH_CALLABLE_CONFIG } from '../config';
import { db } from '../admin';

interface SubmitStudentVerificationInput {
  universityId?: string;
  studentEmail?: string;
}

type VerificationStatus = 'pending' | 'approved' | 'rejected';

export const submitStudentVerification = onCall(
  AUTH_CALLABLE_CONFIG,
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const data = (request.data ?? {}) as SubmitStudentVerificationInput;
    const universityId =
      typeof data.universityId === 'string' ? data.universityId : '';
    const studentEmail =
      typeof data.studentEmail === 'string' ? data.studentEmail.trim().toLowerCase() : '';

    if (!universityId || !studentEmail) {
      throw new HttpsError('invalid-argument', 'universityId and studentEmail are required');
    }

    const uid = request.auth.uid;
    const domain = studentEmail.split('@')[1]?.toLowerCase() ?? '';

    const uniDoc = await db.collection(COLLECTIONS.universities).doc(universityId).get();
    if (!uniDoc.exists) {
      throw new HttpsError('not-found', 'University not found');
    }

    const allowedDomains = (uniDoc.data()?.allowedDomains as string[] | undefined) ?? [];
    const normalizedAllowed = allowedDomains.map((d) => d.toLowerCase());
    const status: VerificationStatus = normalizedAllowed.includes(domain)
      ? 'approved'
      : 'pending';

    const now = FieldValue.serverTimestamp();
    const reviewedAt = status === 'approved' ? now : null;
    const verifiedAt = status === 'approved' ? now : null;

    await db.collection(COLLECTIONS.verificationRequests).add({
      userId: uid,
      universityId,
      studentEmail,
      status,
      reviewedAt,
      rejectionReason: null,
      reviewedBy: null,
      createdAt: now,
      updatedAt: now,
    });

    const profileQuery = await db
      .collection(COLLECTIONS.studentProfiles)
      .where('userId', '==', uid)
      .limit(1)
      .get();

    const profileData = {
      userId: uid,
      universityId,
      studentEmail,
      verificationStatus: status,
      verifiedAt,
      updatedAt: now,
    };

    if (profileQuery.empty) {
      await db.collection(COLLECTIONS.studentProfiles).add({
        ...profileData,
        createdAt: now,
      });
    } else {
      await profileQuery.docs[0].ref.update(profileData);
    }

    return { status };
  }
);
