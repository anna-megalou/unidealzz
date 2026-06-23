import * as dotenv from 'dotenv';
dotenv.config();

import './admin';

// Auth (blocking)
export { onAuthEmail } from './auth/onAuthEmail';

// Callable (onCall)
export { getUserDetails } from './callable/getUserDetails';
export { manageFcmToken } from './callable/manageFcmToken';
export { sendTestNotification } from './callable/sendTestNotification';
export { acceptTeamInvite } from './callable/acceptTeamInvite';
export { deleteStaffMember } from './callable/deleteStaffMember';
export { sendTeamInvite } from './callable/sendTeamInvite';
export { chatAssistant } from './callable/chatAssistant';
export { sendTransactionalEmail } from './callable/sendTransactionalEmail';
export { previewTransactionalEmail } from './callable/previewTransactionalEmail';
export { submitStudentVerification } from './callable/submitStudentVerification';
export { getPublicStats } from './callable/getPublicStats';
export { manageBrand } from './callable/manageBrand';
export { logActivity } from './callable/logActivity';
export { submitPartnershipRequest } from './callable/submitPartnershipRequest';
export { requestPasswordReset } from './callable/requestPasswordReset';
export { validateEmailUnsubscribe, confirmEmailUnsubscribe } from './callable/emailUnsubscribe';

// HTTP (onRequest)
export { healthCheck } from './https/healthCheck';
export { handleEmailUnsubscribe } from './https/handleEmailUnsubscribe';
export { handleEmailSuppression } from './https/handleEmailSuppression';

// Firestore triggers
export { onOfferCreated } from './firestore/onOfferCreated';

// Scheduler
export { processEmailQueue } from './scheduler/processEmailQueue';
