import type { FirestoreTimestamp, Json } from './common';

export type EmailSendStatus = 'sent' | 'failed' | 'queued' | string;

export interface EmailSendLog {
  id: string;
  templateName: string;
  recipientEmail: string;
  status: EmailSendStatus;
  messageId: string | null;
  errorMessage: string | null;
  metadata: Json | null;
  createdAt: FirestoreTimestamp;
}

export interface EmailSendState {
  id: number;
  batchSize: number;
  sendDelayMs: number;
  authEmailTtlMinutes: number;
  transactionalEmailTtlMinutes: number;
  retryAfterUntil: FirestoreTimestamp | null;
  updatedAt: FirestoreTimestamp;
}

export interface EmailUnsubscribeToken {
  id: string;
  email: string;
  token: string;
  usedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
}

export interface SuppressedEmail {
  id: string;
  email: string;
  reason: string;
  metadata: Json | null;
  createdAt: FirestoreTimestamp;
}
