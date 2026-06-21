/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Unidealz'
const LOGO_URL =
  'https://dmxkovuegpbdqfoqmggb.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface SupportConfirmationProps {
  name?: string
  subject?: string
  message?: string
}

const SupportConfirmationEmail = ({
  name,
  subject,
  message,
}: SupportConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your support request — {SITE_NAME} team</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="48" height="48" alt={SITE_NAME} style={logo} />
        </Section>
        <Heading style={h1}>
          {name ? `Thanks, ${name} 👋` : 'Thanks for reaching out 👋'}
        </Heading>
        <Text style={text}>
          We received your support request and our academic support team will
          reply within 24 hours (Mon–Fri, 9am–6pm EET).
        </Text>
        {subject ? (
          <Section style={card}>
            <Text style={cardLabel}>SUBJECT</Text>
            <Text style={cardValue}>{subject}</Text>
            {message ? (
              <>
                <Text style={cardLabel}>YOUR MESSAGE</Text>
                <Text style={cardValueMessage}>{message}</Text>
              </>
            ) : null}
          </Section>
        ) : null}
        <Text style={text}>
          You don't need to do anything — we'll be in touch shortly. If your
          request is urgent, just reply to this email.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Support Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportConfirmationEmail,
  subject: 'We received your Unidealz support request',
  displayName: 'Support ticket confirmation',
  previewData: {
    name: 'Alex',
    subject: 'Verification Assistance',
    message: "I can't verify my student email — can you help?",
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { borderRadius: '12px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 20px',
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
  fontSize: '15px',
  fontWeight: '600' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 16px',
}
const cardValueMessage = {
  fontSize: '14px',
  color: 'hsl(220, 20%, 15%)',
  margin: '0',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}
const footer = {
  fontSize: '13px',
  color: 'hsl(220, 10%, 55%)',
  margin: '32px 0 0',
}
