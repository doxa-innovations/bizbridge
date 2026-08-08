import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Bookmark of a research report by a signed-in dashboard user. Same access
 * pattern as SavedSectors — admin-only through /admin, dashboard-user access
 * routed through the API layer with Better Auth session enforcement.
 */
export const SavedReports: CollectionConfig = {
  slug: 'saved-reports',
  admin: {
    group: 'User data',
    defaultColumns: ['user_id', 'report', 'saved_at'],
    useAsTitle: 'user_id',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'user_id', type: 'text', required: true, index: true },
    {
      name: 'report',
      type: 'relationship',
      relationTo: 'reports',
      required: true,
      index: true,
    },
    {
      name: 'saved_at',
      type: 'date',
      required: true,
      admin: { readOnly: true },
      defaultValue: () => new Date().toISOString(),
    },
  ],
  indexes: [{ fields: ['user_id', 'report'], unique: true }],
  timestamps: true,
}
