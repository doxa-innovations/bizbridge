import type { CollectionConfig } from 'payload'
import { anyone, isAdmin, activeOrAdmin } from '../access'

export const BusinessSectors: CollectionConfig = {
  slug: 'business-sectors',
  admin: {
    useAsTitle: 'name_en',
    group: 'Content',
    defaultColumns: ['name_en', 'mor_code', 'slug', 'category', 'is_featured', 'is_active'],
    description: 'Primary content table. Populated from MOR Directive 17/2011 documents.',
  },
  lockDocuments: false,
  access: {
    read: activeOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'mor_code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'MOR Sector Code',
      admin: { description: 'Official MOR sector code as it appears in Directive 17/2011.' },
    },
    {
      name: 'name_en',
      type: 'text',
      required: true,
      index: true,
      label: 'Name (English)',
    },
    {
      name: 'name_am',
      type: 'text',
      label: 'Name (Amharic)',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'sector-categories',
      required: true,
      index: true,
    },
    {
      name: 'description_short',
      type: 'textarea',
      required: true,
      maxLength: 600,
      label: 'Short description (2–3 sentences)',
    },
    {
      name: 'description_full',
      type: 'richText',
      label: 'Full description',
    },
    {
      name: 'legacy_codes',
      type: 'array',
      label: 'Legacy MOR codes',
      admin: {
        description: 'Previous codes that map to this sector under Directive 17/2011.',
      },
      fields: [{ name: 'code', type: 'text', required: true }],
    },
    {
      name: 'permitted_operations_am',
      type: 'array',
      label: 'Permitted operations (Amharic, from MoR directive)',
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'permitted_operations_en',
      type: 'array',
      label: 'Permitted operations (English translation)',
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'is_featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  versions: {
    drafts: false,
  },
  timestamps: true,
}
