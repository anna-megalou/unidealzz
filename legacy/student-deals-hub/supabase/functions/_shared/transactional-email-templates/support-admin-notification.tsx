/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Unidealz'

interface SupportAdminNotificationProps {
  name?: string
  email?: string
  subject?: string
  message?: string
  ticketId?: string
}

const SupportAdminNotificationEmail = ({
  name,
  email,
  subject,
  message,
  ticketId,
}: SupportAdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      New support ticket{subject ? `: ${subject}` : ''}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New support ticket</Heading>
        <Text style={text}>
          A new ticket has been submitted on {SITE_NAME}.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>FROM</Text>
          <Text style={cardValue}>
            {name || 'Unknown'} {email ? `<${email}>` : ''}
          </Text>
          <Text style={cardLabel}>SUBJECT</Text>
          <Text style={cardValue}>{subject || '—'}</Text>
          <Text style={cardLabel}>MESSAGE</Text>
          <Text style={cardValueMessage}>{message || '—'}</Text>
          {ticketId ? (
            <>
              <Text style={cardLabel}>TICKET ID</Text>
              <Text style={cardValueMono}>{ticketId}</Text>
            </>
          ) : null}
        </Section>
        <Text style={footer}>
          Manage tickets in the Operations portal → Support.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportAdminNotificationEmail,
  subject: (data: Record<string, any>) =>
    `[Support] ${data?.subject ?? 'New ticket'}`,
  displayName: 'Support ticket — admin notification',
  previewData: {
    name: 'Alex Papadopoulos',
    email: 'alex@aueb.gr',
    subject: 'Verification Assistance',
    message: "I can't verify my student email — can you help?",
    ticketId: '11111111-2222-3333-4444-555555555555',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const card = {
  backgroundColor: 'hsl(220, 10%, 96%)',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '8px 0 24px',
}
const cardLabel = {
  fontSize: '11px',
  fontWeight: '700' as const,
  letterSpacing: '0.12em',
  color: 'hsl(220, 10%, 55%)',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
}
const cardValue = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 14px',
}
const cardValueMessage = {
  fontSize: '14px',
  color: 'hsl(220, 20%, 15%)',
  margin: '0 0 14px',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}
const cardValueMono = {
  fontSize: '12px',
  color: 'hsl(220, 10%, 35%)',
  margin: '0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}
const footer = {
  fontSize: '13px',
  color: 'hsl(220, 10%, 55%)',
  margin: '24px 0 0',
}
