import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorApprovals: CollectionConfig = {
  slug: 'sector-approvals',
  admin: {
    useAsTitle: 'approval_name',
    group: 'Sector Data',
    defaultColumns: ['approval_name', 'approving_ministry', 'sector', 'sequence_order'],
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
    { name: 'approval_name', type: 'text', required: true },
    { name: 'approving_ministry', type: 'text', required: true },
    { name: 'sequence_order', type: 'number', required: true, defaultValue: 0 },
    { name: 'processing_days_min', type: 'number' },
    { name: 'processing_days_max', type: 'number' },
    { name: 'is_required', type: 'checkbox', defaultValue: true },
    { name: 'notes', type: 'textarea' },
  ],
}
