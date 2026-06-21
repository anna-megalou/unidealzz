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

interface SupportReplyProps {
  name?: string
  originalSubject?: string
  originalMessage?: string
  replyMessage?: string
  agentName?: string
}

const SupportReplyEmail = ({
  name,
  originalSubject,
  originalMessage,
  replyMessage,
  agentName,
}: SupportReplyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Reply from ${SITE_NAME} support`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="48" height="48" alt={SITE_NAME} style={logo} />
        </Section>
        <Heading style={h1}>
          {name ? `Hi ${name} 👋` : 'Hi there 👋'}
        </Heading>
        <Text style={text}>
          {agentName
            ? `${agentName} from the ${SITE_NAME} support team here — thanks for reaching out.`
            : `Thanks for reaching out to ${SITE_NAME} support.`}
        </Text>
        <Section style={replyCard}>
          <Text style={replyText}>{replyMessage ?? ''}</Text>
        </Section>
        <Text style={text}>
          If you have any follow-up questions, just reply to this email and
          we'll get back to you.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Support Team</Text>

        {originalSubject || originalMessage ? (
          <Section style={quoteCard}>
            <Text style={quoteLabel}>YOUR ORIGINAL MESSAGE</Text>
            {originalSubject ? (
              <Text style={quoteSubject}>{originalSubject}</Text>
            ) : null}
            {originalMessage ? (
              <Text style={quoteBody}>{originalMessage}</Text>
            ) : null}
          </Section>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportReplyEmail,
  subject: (data: Record<string, any>) =>
    data?.originalSubject
      ? `Re: ${data.originalSubject}`
      : 'Reply from Unidealz support',
  displayName: 'Support reply',
  previewData: {
    name: 'Alex',
    agentName: 'Maria',
    originalSubject: 'Verification Assistance',
    originalMessage: "I can't verify my student email — can you help?",
    replyMessage:
      "Hi Alex,\n\nThanks for reaching out! Please try resubmitting your student email from your account page — let us know if it still doesn't work.\n\nBest,\nMaria",
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
const replyCard = {
  backgroundColor: '#ffffff',
  borderLeft: '3px solid hsl(195, 75%, 45%)',
  padding: '4px 18px',
  margin: '8px 0 24px',
}
const replyText = {
  fontSize: '15px',
  color: 'hsl(220, 20%, 15%)',
  lineHeight: '1.65',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}
const footer = {
  fontSize: '13px',
  color: 'hsl(220, 10%, 55%)',
  margin: '24px 0 0',
}
const quoteCard = {
  backgroundColor: 'hsl(220, 10%, 96%)',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '32px 0 0',
}
const quoteLabel = {
  fontSize: '11px',
  fontWeight: '700' as const,
  letterSpacing: '0.12em',
  color: 'hsl(220, 10%, 55%)',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}
const quoteSubject = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: 'hsl(220, 20%, 20%)',
  margin: '0 0 8px',
}
const quoteBody = {
  fontSize: '13px',
  color: 'hsl(220, 10%, 40%)',
  margin: '0',
  lineHeight: '1.55',
  whiteSpace: 'pre-wrap' as const,
}
