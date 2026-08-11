import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * A dashboard user's progress against the setup checklist for a given sector.
 * `items` is an array of `{step_id, completed, completed_at, note}` — step_id
 * matches the SectorSteps.id in Payload so we can align progress with the
 * canonical steps.
 *
 * progress_pct is computed in a beforeChange hook from the ratio of completed
 * items to total items, so the client can render a progress bar without a
 * derived query.
 */
export const UserChecklists: CollectionConfig = {
  slug: 'user-checklists',
  admin: {
    group: 'User data',
    defaultColumns: ['user_id', 'sector', 'progress_pct', 'updatedAt'],
    useAsTitle: 'user_id',
  },
  lockDocuments: false,
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'user_id', type: 'text', required: true, index: true },
    {
      name: 'sector',
      type: 'relationship',
      relationTo: 'business-sectors',
      required: true,
      index: true,
    },
    {
      name: 'items',
      type: 'array',
      admin: { description: 'One row per checklist item this user is tracking.' },
      fields: [
        { name: 'step_id', type: 'text', required: true },
        { name: 'completed', type: 'checkbox', defaultValue: false },
        { name: 'completed_at', type: 'date' },
        { name: 'note', type: 'textarea', maxLength: 400 },
      ],
    },
    {
      name: 'progress_pct',
      type: 'number',
      admin: { readOnly: true, description: 'Auto-computed from items[].completed.' },
      min: 0,
      max: 100,
      defaultValue: 0,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const items = Array.isArray(data.items) ? data.items : []
        if (items.length === 0) {
          data.progress_pct = 0
        } else {
          const done = items.filter((i: { completed?: boolean }) => Boolean(i?.completed)).length
          data.progress_pct = Math.round((done / items.length) * 100)
        }
        return data
      },
    ],
  },
  indexes: [{ fields: ['user_id', 'sector'], unique: true }],
  timestamps: true,
}
