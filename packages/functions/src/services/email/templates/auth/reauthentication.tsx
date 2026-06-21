import * as React from 'react';
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
} from '@react-email/components';

interface ReauthenticationEmailProps {
  token: string;
  siteName?: string;
}

export const ReauthenticationEmail = ({
  token,
  siteName = 'Unidealz',
}: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Unidealz verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="48" height="48" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Confirm it&apos;s you</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn&apos;t request it, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
);

const logoUrl =
  'https://dmxkovuegpbdqfoqmggb.supabase.co/storage/v1/object/public/email-assets/logo.png';
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
};
const container = { padding: '32px 28px', maxWidth: '560px' };
const logoSection = { marginBottom: '24px' };
const logo = { borderRadius: '12px' };
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 20px',
  letterSpacing: '-0.01em',
};
const text = {
  fontSize: '15px',
  color: 'hsl(220, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
};
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 70%, 45%)',
  letterSpacing: '0.15em',
  margin: '0 0 30px',
};
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 55%)', margin: '32px 0 0' };
