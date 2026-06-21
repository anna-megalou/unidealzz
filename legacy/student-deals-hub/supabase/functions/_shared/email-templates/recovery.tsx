/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Unidealz password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="48" height="48" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset the password for your Unidealz account.
          Click the button below to choose a new one.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Reset password
          </Button>
        </Section>
        <Text style={fallbackText}>
          Or copy and paste this link into your browser:
        </Text>
        <Link href={confirmationUrl} style={fallbackLink}>
          {confirmationUrl}
        </Link>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email — your password won't change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const logoUrl = 'https://dmxkovuegpbdqfoqmggb.supabase.co/storage/v1/object/public/email-assets/logo.png'
const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { borderRadius: '12px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#141a24',
  margin: '0 0 20px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: '#666b75',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#2562c4',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const buttonSection = { margin: '8px 0 28px', textAlign: 'center' as const }
const fallbackText = { fontSize: '13px', color: '#666b75', margin: '0 0 6px' }
const fallbackLink = { fontSize: '13px', color: '#2562c4', wordBreak: 'break-all' as const, textDecoration: 'underline' }
const footer = { fontSize: '13px', color: '#7f8590', margin: '32px 0 0' }
