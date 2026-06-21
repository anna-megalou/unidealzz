/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as supportConfirmation } from './support-confirmation.tsx'
import { template as supportAdminNotification } from './support-admin-notification.tsx'
import { template as supportReply } from './support-reply.tsx'
import { template as favoriteBrandNewOffer } from './favorite-brand-new-offer.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'support-confirmation': supportConfirmation,
  'support-admin-notification': supportAdminNotification,
  'support-reply': supportReply,
  'favorite-brand-new-offer': favoriteBrandNewOffer,
}
