import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { config, assertFirebaseProjectId } from '../config.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

export function getFirebaseAdmin(): typeof admin {
  if (admin.apps.length === 0) {
    assertFirebaseProjectId();
    admin.initializeApp({
      projectId: config.firebaseProjectId,
      storageBucket: `${config.firebaseProjectId}.appspot.com`,
    });
  }
  return admin;
}

export function getFirestore() {
  return getFirebaseAdmin().firestore();
}

export function getAuth() {
  return getFirebaseAdmin().auth();
}

export function getStorage() {
  return getFirebaseAdmin().storage();
}
