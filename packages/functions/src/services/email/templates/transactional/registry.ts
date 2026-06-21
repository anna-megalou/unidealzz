import type { TemplateEntry } from '../../types';
import { template as favoriteBrandNewOffer } from './favoriteBrandNewOffer';
import { template as supportAdminNotification } from './supportAdminNotification';
import { template as supportConfirmation } from './supportConfirmation';
import { template as supportReply } from './supportReply';

export const TEMPLATES: Record<string, TemplateEntry> = {
  'support-confirmation': supportConfirmation,
  'support-admin-notification': supportAdminNotification,
  'support-reply': supportReply,
  'favorite-brand-new-offer': favoriteBrandNewOffer,
};
