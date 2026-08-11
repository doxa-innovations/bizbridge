import type { CollectionConfig } from 'payload'
import { publishedOrAdmin, isAdmin } from '../access'

export const MarketResearch: CollectionConfig = {
  slug: 'market-research',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'city', 'category', '_status'],
  },
  lockDocuments: false,
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true, index: true },
    {
      name: 'city',
      type: 'text',
      required: true,
      defaultValue: 'Bishoftu',
      index: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Demographics', value: 'demographics' },
        { label: 'Tourism', value: 'tourism' },
        { label: 'Economy', value: 'economy' },
        { label: 'Infrastructure', value: 'infrastructure' },
        { label: 'Opportunities', value: 'opportunities' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'content', type: 'richText' },
    { name: 'structured_data', type: 'json' },
    { name: 'source', type: 'text' },
    {
      name: 'collected_at',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
  ],
  timestamps: true,
}
