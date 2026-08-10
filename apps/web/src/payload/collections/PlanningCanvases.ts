import type { CollectionConfig } from 'payload'
import crypto from 'node:crypto'
import { isAdmin } from '../access'

/**
 * A user-owned free-form planning canvas — React Flow nodes + edges stored
 * as JSON blobs, plus optional public-share tokens.
 *
 * Same cross-schema ownership pattern as the other user-scoped collections:
 * `user_id` is Better Auth's user.id in `public`, Payload lives in
 * `payload`, so no cascade delete — orphans are handled by a separate
 * cleanup script.
 *
 * Access model:
 *  - /admin sees admin-only via `isAdmin`.
 *  - Runtime CRUD flows through /api/canvases (POST/PATCH) and the two
 *    dashboard route handlers, all of which enforce owner-only using the
 *    Better Auth session with `overrideAccess: true`.
 *  - The public share view (/canvas/[shareToken]) reads with
 *    overrideAccess: true and filters by is_public + share_token.
 */
export const PlanningCanvases: CollectionConfig = {
  slug: 'planning-canvases',
  admin: {
    group: 'User data',
    defaultColumns: ['title', 'user_id', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'user_id', type: 'text', required: true, index: true },
    { name: 'title', type: 'text', required: true, defaultValue: 'Untitled plan' },
    {
      name: 'template',
      type: 'select',
      defaultValue: 'blank',
      options: [
        { label: 'Blank', value: 'blank' },
        { label: 'Onboarding auto-seed', value: 'onboarding' },
      ],
    },
    {
      name: 'nodes',
      type: 'json',
      required: true,
      defaultValue: [],
      admin: {
        description: 'React Flow node array — [{ id, type, position: {x,y}, data: {...} }].',
      },
    },
    {
      name: 'edges',
      type: 'json',
      required: true,
      defaultValue: [],
      admin: {
        description: 'React Flow edge array — [{ id, source, target, label? }].',
      },
    },
    {
      name: 'is_public',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'When true, anyone with the share_token can view (read-only).' },
    },
    {
      name: 'share_token',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'Auto-generated on first publish.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Mint a share token the first time is_public flips to true. Keep
        // the same token across future toggles so an already-shared URL
        // keeps working after a temporary unpublish. Payload manages
        // updatedAt itself when timestamps: true — don't touch it here.
        if (data.is_public && !data.share_token && !originalDoc?.share_token) {
          data.share_token = crypto.randomBytes(12).toString('base64url')
        }
        return data
      },
    ],
  },
  timestamps: true,
}
