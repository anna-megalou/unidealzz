import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Unidealz login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="48" height="48" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Log in to Unidealz</Heading>
        <Text style={text}>
          Click the button below to log in. This link will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log in
        </Button>
        <Text style={footer}>
          If you didn&apos;t request this link, you can safely ignore this email.
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
const button = {
  backgroundColor: 'hsl(220, 70%, 45%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
};
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 55%)', margin: '32px 0 0' };
