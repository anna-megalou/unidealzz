/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Unidealz'
const SITE_URL = 'https://unidealz.gr'
const LOGO_URL =
  'https://dmxkovuegpbdqfoqmggb.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface OfferItem {
  title: string
  brandName: string
  discountLabel?: string
  url: string
  imageUrl?: string
}

interface Props {
  name?: string
  offers?: OfferItem[]
}

const FavoriteBrandNewOfferEmail = ({ name, offers = [] }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      New deals from your favorite brands on {SITE_NAME}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="48" height="48" alt={SITE_NAME} style={logo} />
        </Section>
        <Heading style={h1}>
          {name ? `Hey ${name},` : 'Hey there,'} new deals just dropped
        </Heading>
        <Text style={text}>
          Brands you've saved to your favorites just launched fresh student
          discounts. Grab them before they're gone.
        </Text>

        {offers.map((o, i) => (
          <Section key={i} style={card}>
            <Text style={cardLabel}>{o.brandName.toUpperCase()}</Text>
            <Text style={cardTitle}>{o.title}</Text>
            {o.discountLabel ? (
              <Text style={discount}>{o.discountLabel}</Text>
            ) : null}
            <Button href={o.url} style={cardButton}>
              View deal
            </Button>
          </Section>
        ))}

        <Hr style={hr} />
        <Button href={`${SITE_URL}/offers`} style={primaryButton}>
          Browse all deals
        </Button>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FavoriteBrandNewOfferEmail,
  subject: (data: Record<string, any>) => {
    const count = Array.isArray(data?.offers) ? data.offers.length : 0
    if (count <= 1) return `New deal from your favorite brand on ${SITE_NAME}`
    return `${count} new deals from your favorite brands on ${SITE_NAME}`
  },
  displayName: 'Favorite brand — new offer alert',
  previewData: {
    name: 'Alex',
    offers: [
      {
        title: '20% off your next coffee',
        brandName: 'Coffee Island',
        discountLabel: '20% OFF',
        url: 'https://unidealz.gr/offers',
      },
      {
        title: 'Student bundle: 3 months free',
        brandName: 'Spotify',
        discountLabel: '3 MONTHS FREE',
        url: 'https://unidealz.gr/offers',
      },
    ],
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
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const card = {
  backgroundColor: 'hsl(220, 10%, 96%)',
  borderRadius: '14px',
  padding: '18px 20px',
  margin: '0 0 14px',
}
const cardLabel = {
  fontSize: '11px',
  fontWeight: '700' as const,
  letterSpacing: '0.12em',
  color: 'hsl(220, 10%, 50%)',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
}
const cardTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 8px',
}
const discount = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: '700' as const,
  color: 'hsl(200, 95%, 35%)',
  backgroundColor: 'hsl(200, 95%, 92%)',
  borderRadius: '999px',
  padding: '4px 10px',
  margin: '0 0 14px',
}
const cardButton = {
  backgroundColor: 'hsl(220, 20%, 10%)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '10px 16px',
  borderRadius: '10px',
  textDecoration: 'none',
}
const primaryButton = {
  backgroundColor: 'hsl(200, 95%, 35%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '12px 20px',
  borderRadius: '12px',
  textDecoration: 'none',
}
const hr = {
  border: 'none',
  borderTop: '1px solid hsl(220, 10%, 92%)',
  margin: '24px 0',
}
const footer = {
  fontSize: '13px',
  color: 'hsl(220, 10%, 55%)',
  margin: '28px 0 0',
}
