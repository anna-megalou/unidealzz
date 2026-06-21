import type { ComponentType } from 'react';

export type EmailQueueName = 'auth_emails' | 'transactional_emails';

export interface TemplateEntry {
  component: ComponentType<Record<string, unknown>>;
  subject: string | ((data: Record<string, unknown>) => string);
  to?: string;
  displayName?: string;
  previewData?: Record<string, unknown>;
}

export interface EmailQueuePayload {
  messageId: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  purpose: string;
  label: string;
  idempotencyKey?: string;
  unsubscribeToken?: string;
  queuedAt: string;
}

export interface SendTransactionalEmailInput {
  templateName: string;
  recipientEmail?: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
}

export interface SendTransactionalEmailResult {
  success: boolean;
  queued?: boolean;
  reason?: string;
}

export type AuthEmailType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'reauthentication';

export interface SendAuthEmailInput {
  type: AuthEmailType;
  email: string;
  confirmationUrl?: string;
  token?: string;
  newEmail?: string;
  siteUrl?: string;
}
