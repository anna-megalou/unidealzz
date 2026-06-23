export const SITE_NAME = 'Unidealz';
export const SITE_URL = process.env.SITE_URL ?? 'https://unidealz.gr';
export const DASHBOARD_URL = process.env.DASHBOARD_URL ?? 'https://app.unidealz.gr';
export const FROM_DOMAIN = process.env.EMAIL_FROM_DOMAIN ?? 'unidealz.gr';
export const FROM_EMAIL =
  process.env.EMAIL_FROM_ADDRESS ?? `${SITE_NAME} <noreply@${FROM_DOMAIN}>`;
export const LOGO_URL =
  process.env.EMAIL_LOGO_URL ??
  'https://dmxkovuegpbdqfoqmggb.supabase.co/storage/v1/object/public/email-assets/logo.png';

export const AUTH_QUEUE = 'auth_emails' as const;
export const TRANSACTIONAL_QUEUE = 'transactional_emails' as const;

export const MAX_EMAIL_RETRIES = 5;
export const DEFAULT_BATCH_SIZE = 10;
export const DEFAULT_SEND_DELAY_MS = 200;
export const DEFAULT_AUTH_TTL_MINUTES = 15;
export const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 60;

export const AUTH_EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
};
