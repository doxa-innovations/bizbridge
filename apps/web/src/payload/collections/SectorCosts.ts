import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SectorCosts: CollectionConfig = {
  slug: 'sector-costs',
  admin: {
    useAsTitle: 'cost_item',
    group: 'Sector Data',
    defaultColumns: ['cost_item', 'sector', 'amount_birr_min', 'amount_birr_max', 'is_official_fee'],
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
    { name: 'cost_item', type: 'text', required: true },
    { name: 'amount_birr_min', type: 'number', admin: { step: 0.01 } },
    { name: 'amount_birr_max', type: 'number', admin: { step: 0.01 } },
    { name: 'amount_usd_min', type: 'number', admin: { step: 0.01 } },
    { name: 'amount_usd_max', type: 'number', admin: { step: 0.01 } },
    {
      name: 'is_official_fee',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'True = government fee. False = our estimate.' },
    },
    { name: 'notes', type: 'textarea' },
    {
      name: 'last_verified_at',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
  ],
  timestamps: true,
}
