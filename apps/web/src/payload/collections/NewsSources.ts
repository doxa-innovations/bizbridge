import type { CollectionConfig } from 'payload'
import { isAdmin, activeOrAdmin } from '../access'

/**
 * Curated directory of Ethiopian business news sources, media handles, gov
 * portals and economic data feeds surfaced on /dashboard/pulse. Cheri edits
 * this list from /admin — public dashboard queries filter by is_active.
 *
 * Telegram entries with allow_scrape=true opt into a nightly server-side
 * scrape of https://t.me/s/<handle> for recent post previews; scraping is
 * off by default to keep us on the right side of Telegram's ToS.
 */
export const NewsSources: CollectionConfig = {
  slug: 'news-sources',
  admin: {
    group: 'Content',
    defaultColumns: ['name', 'type', 'category', 'priority', 'is_active'],
    useAsTitle: 'name',
  },
  access: {
    read: activeOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'News site', value: 'news_site' },
        { label: 'Newspaper', value: 'newspaper' },
        { label: 'TV', value: 'tv' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'Telegram', value: 'telegram' },
        { label: 'Government portal', value: 'gov_portal' },
        { label: 'Economic data', value: 'economic_data' },
      ],
    },
    { name: 'url', type: 'text', required: true },
    {
      name: 'handle',
      type: 'text',
      admin: { description: 'Telegram/YouTube handle without @ (e.g. tebekasamuel).' },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Business', value: 'business' },
        { label: 'Policy', value: 'policy' },
        { label: 'Finance', value: 'finance' },
        { label: 'Sector-specific', value: 'sector_specific' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'general',
      index: true,
    },
    {
      name: 'sector_hint',
      type: 'relationship',
      relationTo: 'business-sectors',
      admin: { description: 'Optional — tie a Telegram channel to a specific MOR sector.' },
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'description_en', type: 'textarea', maxLength: 240 },
    { name: 'description_am', type: 'textarea', maxLength: 240 },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 50,
      admin: { description: 'Higher = shown earlier in the feed.' },
    },
    { name: 'is_active', type: 'checkbox', defaultValue: true, index: true },
    {
      name: 'allow_scrape',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Telegram only. If on, /dashboard/pulse will pull recent post previews from t.me/s/<handle> and cache for 30 min.',
      },
    },
    { name: 'subscribers', type: 'number', admin: { description: 'Optional metadata for display.' } },
  ],
  timestamps: true,
}
