import * as React from 'react';
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
} from '@react-email/components';

interface EmailChangeEmailProps {
  siteName: string;
  email: string;
  newEmail: string;
  confirmationUrl: string;
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new email for Unidealz</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="48" height="48" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Confirm your new email</Heading>
        <Text style={text}>
          You requested to change your Unidealz email from{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>Click below to confirm the change:</Text>
        <Button style={button} href={confirmationUrl}>
          Confirm email change
        </Button>
        <Text style={footer}>
          If you didn&apos;t request this change, please secure your account immediately.
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
const link = { color: 'hsl(220, 70%, 45%)', textDecoration: 'none' };
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
