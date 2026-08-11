import type { CollectionConfig } from 'payload'
import { publishedOrAdmin, isAdmin } from '../access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
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
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'seo_description', type: 'textarea', maxLength: 200 },
    { name: 'content', type: 'richText' },
  ],
  timestamps: true,
}
