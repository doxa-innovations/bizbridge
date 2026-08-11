import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorSteps: CollectionConfig = {
  slug: 'sector-steps',
  admin: {
    useAsTitle: 'title',
    group: 'Sector Data',
    defaultColumns: ['step_number', 'title', 'sector'],
  },
  lockDocuments: false,
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'sector',
      type: 'relationship',
      relationTo: 'business-sectors',
      required: true,
      index: true,
    },
    { name: 'step_number', type: 'number', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'richText' },
    {
      name: 'where_to_go',
      type: 'text',
      admin: { description: 'Physical office or URL (e.g. Bishoftu City Trade Office).' },
    },
    {
      name: 'documents_needed',
      type: 'array',
      fields: [{ name: 'document', type: 'text', required: true }],
    },
    { name: 'estimated_days', type: 'number' },
    {
      name: 'cost_reference',
      type: 'relationship',
      relationTo: 'sector-costs',
    },
  ],
}
