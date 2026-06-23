import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getFunctions,
  Functions,
  httpsCallable,
  connectFunctionsEmulator,
} from 'firebase/functions';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  AppCheck,
} from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

let app: FirebaseApp;
let db: Firestore;
let functions: Functions;
let appCheck: AppCheck | null = null;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
functions = getFunctions(app, 'us-central1');

if (useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Using Firebase emulators');
}

const reCaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const isPlaceholderRecaptchaKey =
  !reCaptchaSiteKey || reCaptchaSiteKey.startsWith('demo-');
if (reCaptchaSiteKey && !(useEmulators && isPlaceholderRecaptchaKey)) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('🛡️ App Check initialized');
  } catch (e) {
    console.warn('App Check initialization failed:', e);
  }
} else if (useEmulators) {
  console.log('🔧 App Check: Skipped (emulator mode)');
} else {
  console.warn('⚠️ App Check not initialized: VITE_RECAPTCHA_SITE_KEY not set');
}

if (!useEmulators && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export interface PublicStats {
  registeredStudentsCount: number;
  brandCount: number;
  totalSavingsEur: number;
}

export interface PartnershipRequestInput {
  brandName: string;
  email: string;
}

export interface ChatAssistantInput {
  messages: { role: 'user' | 'assistant'; content: string }[];
  pageContext?: {
    path?: string;
    offerId?: string;
  };
}

export interface ChatAssistantResponse {
  content: string;
}

export interface EmailUnsubscribeValidateResponse {
  valid: boolean;
  reason?: 'already_unsubscribed' | 'invalid_token';
}

export interface EmailUnsubscribeConfirmResponse {
  success: boolean;
  reason?: 'already_unsubscribed';
}

export const callGetPublicStats = httpsCallable<void, PublicStats>(
  functions,
  'getPublicStats',
);

export const callSubmitPartnershipRequest = httpsCallable<
  PartnershipRequestInput,
  { success: boolean }
>(functions, 'submitPartnershipRequest');

export const callChatAssistant = httpsCallable<
  ChatAssistantInput,
  ChatAssistantResponse
>(functions, 'chatAssistant');

export const callValidateEmailUnsubscribe = httpsCallable<
  { token: string },
  EmailUnsubscribeValidateResponse
>(functions, 'validateEmailUnsubscribe');

export const callConfirmEmailUnsubscribe = httpsCallable<
  { token: string },
  EmailUnsubscribeConfirmResponse
>(functions, 'confirmEmailUnsubscribe');

export { app, db, functions, appCheck, analytics, useEmulators };
