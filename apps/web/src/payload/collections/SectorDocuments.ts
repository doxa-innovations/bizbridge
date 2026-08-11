import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorDocuments: CollectionConfig = {
  slug: 'sector-documents',
  upload: {
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  admin: {
    useAsTitle: 'title',
    group: 'Sector Data',
    defaultColumns: ['title', 'sector', 'file_type', 'download_count'],
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
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'file_type',
      type: 'select',
      required: true,
      defaultValue: 'pdf',
      options: [
        { label: 'PDF', value: 'pdf' },
        { label: 'DOCX', value: 'docx' },
        { label: 'XLSX', value: 'xlsx' },
      ],
    },
    {
      name: 'download_count',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}
