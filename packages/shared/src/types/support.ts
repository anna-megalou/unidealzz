import { z } from 'zod';
import type { FirestoreTimestamp } from './common';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;

export interface SupportTicket {
  id: string;
  fullName: string;
  studentEmail: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  userId: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export const SupportTicketSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  studentEmail: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(5).max(2000),
});

export type SupportTicketInput = z.infer<typeof SupportTicketSchema>;

export const SUPPORT_TICKET_SUBJECTS = [
  'Verification Assistance',
  'Claiming an Offer',
  'Account Issue',
  'Merchant Portal Help',
  'Technical Issue',
  'Other',
] as const;

export type SupportTicketSubject = (typeof SUPPORT_TICKET_SUBJECTS)[number];
