import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Bookmark of a MOR sector by a signed-in dashboard user. The `user_id` is
 * Better Auth's user.id (in the public schema) — Payload can't cascade this
 * relationship across schemas, so orphan cleanup is a separate concern.
 *
 * All CRUD happens through /api/saved-sectors which enforces owner-only
 * access using the Better Auth session; Payload's access rules restrict the
 * /admin surface to admins only.
 */
export const SavedSectors: CollectionConfig = {
  slug: 'saved-sectors',
  admin: {
    group: 'User data',
    defaultColumns: ['user_id', 'sector', 'saved_at'],
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
      name: 'saved_at',
      type: 'date',
      required: true,
      admin: { readOnly: true },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'note',
      type: 'textarea',
      admin: { description: 'Optional 200-char note the user attached to this bookmark.' },
      maxLength: 200,
    },
  ],
  indexes: [
    // Prevent duplicate bookmarks per user.
    { fields: ['user_id', 'sector'], unique: true },
  ],
  timestamps: true,
}
