import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { assertFirebaseProjectId, configureFirebaseCredentials, config } from '../config.js';
import { requireSupabaseConfig } from '../config.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const { url, serviceRoleKey } = requireSupabaseConfig();
    supabaseClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

function ensureFirebaseApp() {
  if (getApps().length > 0) return;

  configureFirebaseCredentials();
  const projectId = assertFirebaseProjectId();
  initializeApp({
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  });
}

export function getFirestore() {
  ensureFirebaseApp();
  return getAdminFirestore();
}

export function getAuth() {
  ensureFirebaseApp();
  return getAdminAuth();
}

export function getStorage() {
  ensureFirebaseApp();
  return getAdminStorage();
}
