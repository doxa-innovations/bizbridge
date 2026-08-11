import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorCompetencyCertificates: CollectionConfig = {
  slug: 'sector-competency-certificates',
  admin: {
    useAsTitle: 'certificate_name',
    group: 'Sector Data',
    defaultColumns: ['certificate_name', 'issuing_body', 'sector', 'is_mandatory'],
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
    { name: 'certificate_name', type: 'text', required: true },
    { name: 'issuing_body', type: 'text', required: true },
    { name: 'is_mandatory', type: 'checkbox', defaultValue: true },
    { name: 'description', type: 'textarea' },
    { name: 'processing_days_min', type: 'number' },
    { name: 'processing_days_max', type: 'number' },
  ],
}
