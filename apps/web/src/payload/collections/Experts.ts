import type { CollectionConfig } from 'payload'
import { activeOrAdmin, isAdmin } from '../access'

export const Experts: CollectionConfig = {
  slug: 'experts',
  admin: {
    useAsTitle: 'full_name',
    group: 'Content',
    defaultColumns: ['full_name', 'title', 'location', 'is_verified', 'is_active'],
  },
  lockDocuments: false,
  access: {
    read: activeOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'full_name', type: 'text', required: true },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'e.g. Business Registration Agent' },
    },
    { name: 'bio', type: 'richText' },
    {
      name: 'specializations',
      type: 'array',
      fields: [
        {
          name: 'sector',
          type: 'relationship',
          relationTo: 'business-sectors',
        },
        { name: 'free_text', type: 'text' },
      ],
    },
    {
      name: 'languages',
      type: 'array',
      fields: [
        {
          name: 'code',
          type: 'select',
          required: true,
          options: [
            { label: 'Amharic', value: 'am' },
            { label: 'English', value: 'en' },
            { label: 'Oromo', value: 'or' },
            { label: 'Tigrinya', value: 'ti' },
            { label: 'Somali', value: 'so' },
          ],
        },
      ],
    },
    { name: 'location', type: 'text', defaultValue: 'Bishoftu' },
    { name: 'is_platform_team', type: 'checkbox', defaultValue: false },
    { name: 'is_verified', type: 'checkbox', defaultValue: false },
    {
      name: 'rating_avg',
      type: 'number',
      admin: { readOnly: true, step: 0.1, description: 'Computed from expert_reviews.' },
    },
    {
      name: 'review_count',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    { name: 'session_price_usd', type: 'number', required: true, admin: { step: 0.01 } },
    { name: 'session_price_birr', type: 'number', required: true, admin: { step: 0.01 } },
    {
      name: 'cal_username',
      type: 'text',
      admin: { description: 'Cal.com username for booking proxy.' },
    },
    {
      name: 'profile_image',
      type: 'upload',
      relationTo: 'media',
    },
    { name: 'is_active', type: 'checkbox', defaultValue: true },
  ],
  timestamps: true,
}
