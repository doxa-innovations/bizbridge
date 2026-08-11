import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Product analytics event stream. One row per meaningful interaction —
 * page view, search, sector view, tool use, signup, onboarding done,
 * canvas create, report request. Aggregated at read time by the
 * /dashboard/admin/analytics page to show top sectors, top searches,
 * active users, etc.
 *
 * `user_id` is Better Auth's `user.id` when the visitor is signed in,
 * `null` otherwise. `session_id` is a client-minted stable ID stored
 * in a first-party cookie so anonymous sessions can be threaded across
 * page views without needing an account. Both are indexed for
 * "recent activity per user/session" queries.
 *
 * We intentionally store just enough for aggregation, not full
 * behavioural profiles — no scroll tracking, no click heatmaps, no
 * fingerprinting.
 */
export const PageEvents: CollectionConfig = {
  slug: 'page-events',
  admin: {
    group: 'Analytics',
    defaultColumns: ['createdAt', 'event_type', 'path', 'user_id'],
    useAsTitle: 'path',
  },
  lockDocuments: false,
  access: {
    read: isAdmin,
    create: isAdmin, // writes go through /api/track with overrideAccess
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'event_type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Page view', value: 'page_view' },
        { label: 'Search', value: 'search' },
        { label: 'Sector view', value: 'sector_view' },
        { label: 'Tool use', value: 'tool_use' },
        { label: 'Signup', value: 'signup' },
        { label: 'Onboarding complete', value: 'onboarding_complete' },
        { label: 'Canvas create', value: 'canvas_create' },
        { label: 'Report request', value: 'report_request' },
        { label: 'Suggestion submit', value: 'suggestion_submit' },
      ],
    },
    { name: 'path', type: 'text', index: true },
    { name: 'referrer', type: 'text' },
    { name: 'user_id', type: 'text', index: true },
    { name: 'session_id', type: 'text', index: true },
    { name: 'country', type: 'text', admin: { description: 'Best-effort from Cloudflare CF-IPCountry header.' } },
    { name: 'ua', type: 'text', admin: { description: 'Raw user-agent — useful for detecting bots later.' } },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description:
          'Freeform per-event bag — search q, sector mor_code, tool name, referrer path, etc.',
      },
    },
  ],
  timestamps: true,
}
