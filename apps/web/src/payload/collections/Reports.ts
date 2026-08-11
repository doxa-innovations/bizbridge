import type { CollectionConfig } from 'payload'
import { publishedOrAdmin, isAdmin } from '../access'

export const Reports: CollectionConfig = {
  slug: 'reports',
  upload: {
    mimeTypes: ['application/pdf'],
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'sector', 'price_usd', '_status'],
  },
  lockDocuments: false,
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, index: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'sector',
      type: 'relationship',
      relationTo: 'business-sectors',
      admin: { description: 'Optional — leave blank for cross-sector reports.' },
    },
    { name: 'price_usd', type: 'number', required: true, admin: { step: 0.01 } },
    { name: 'price_birr', type: 'number', required: true, admin: { step: 0.01 } },
    {
      name: 'preview',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Public preview PDF (first few pages).' },
    },
  ],
  timestamps: true,
}
