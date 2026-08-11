import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorLicenseRequirements: CollectionConfig = {
  slug: 'sector-license-requirements',
  admin: {
    useAsTitle: 'license_type',
    group: 'Sector Data',
    defaultColumns: ['license_type', 'issuing_authority', 'sector', 'is_required'],
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
    { name: 'license_type', type: 'text', required: true },
    { name: 'issuing_authority', type: 'text', required: true },
    { name: 'is_required', type: 'checkbox', defaultValue: true },
    { name: 'notes', type: 'textarea' },
  ],
}
