import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorCategories: CollectionConfig = {
  slug: 'sector-categories',
  admin: {
    useAsTitle: 'name_en',
    group: 'Content',
    defaultColumns: ['name_en', 'name_am', 'slug', 'sort_order'],
  },
  lockDocuments: false,
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name_en', type: 'text', required: true, label: 'Name (English)' },
    { name: 'name_am', type: 'text', label: 'Name (Amharic)' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL-safe slug (lowercase, dashes).' },
    },
    { name: 'icon', type: 'text', admin: { description: 'Lucide icon name or emoji.' } },
    { name: 'sort_order', type: 'number', defaultValue: 0, required: true },
  ],
}
