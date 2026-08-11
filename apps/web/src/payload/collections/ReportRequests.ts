import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Manual-payment request for a research report. Flow:
 *   1. User picks a report on /dashboard/reports, chooses payment method
 *      (Telebirr or CBE Birr), pays via that channel, uploads a screenshot
 *      of the transaction + provides a reference number.
 *   2. Row is created with status='pending', paymentScreenshot pointing at
 *      the uploaded media record.
 *   3. Admin sees the pending inbox at /admin/collections/report-requests,
 *      verifies the payment against the Telebirr/CBE dashboard, sets
 *      status='verified' (or 'rejected' with an admin_note).
 *   4. On verify, beforeChange populates verified_at, verified_by, and
 *      download_expires_at (+30 days). The user's dashboard now shows a
 *      "Download PDF" button which hits /api/downloads/[requestId] — that
 *      route proxies the file from R2 so the storage URL never leaks.
 *
 * Everything is admin-gated at the Payload level; end-user access goes
 * through /api/report-requests with Better Auth session enforcement.
 */
export const ReportRequests: CollectionConfig = {
  slug: 'report-requests',
  admin: {
    group: 'Payments',
    defaultColumns: ['createdAt', 'user_id', 'report', 'payment_method', 'status'],
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
      name: 'request_type',
      type: 'select',
      required: true,
      defaultValue: 'catalog',
      options: [
        { label: 'Catalog report', value: 'catalog' },
        { label: 'Custom (MOR / Trade Bureau / etc.)', value: 'custom' },
      ],
      index: true,
      admin: {
        description:
          'catalog = user picked from /dashboard/reports; custom = user described a document we don\'t stock (MOR fee schedule, Trade Bureau circular, etc.) and we fulfill manually.',
      },
    },
    {
      name: 'report',
      type: 'relationship',
      relationTo: 'reports',
      // Required only for catalog requests — a beforeValidate hook enforces
      // this rather than a required flag because Payload doesn't do
      // conditional required.
      index: true,
    },
    {
      name: 'custom_title',
      type: 'text',
      admin: {
        condition: (data) => data.request_type === 'custom',
        description: 'Short name of the document the user wants (e.g. "MOR Directive 17/2011 fee schedule").',
      },
    },
    {
      name: 'custom_source',
      type: 'select',
      admin: { condition: (data) => data.request_type === 'custom' },
      options: [
        { label: 'Ministry of Revenue (MOR)', value: 'mor' },
        { label: 'Ministry of Trade & Regional Integration (MoTRI)', value: 'motri' },
        { label: 'Trade Bureau (regional)', value: 'trade_bureau' },
        { label: 'Ethiopian Investment Commission (EIC)', value: 'eic' },
        { label: 'National Bank of Ethiopia (NBE)', value: 'nbe' },
        { label: 'Customs Commission', value: 'customs' },
        { label: 'Central Statistics Agency (CSA)', value: 'csa' },
        { label: 'Other government body', value: 'other_gov' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'custom_notes',
      type: 'textarea',
      admin: {
        condition: (data) => data.request_type === 'custom',
        description: 'Any extra context — dates, sector codes, why they need it.',
      },
    },
    { name: 'amount_etb', type: 'number', required: true, admin: { step: 1 } },
    { name: 'amount_usd', type: 'number', admin: { step: 0.01 } },
    {
      name: 'payment_method',
      type: 'select',
      required: true,
      options: [
        { label: 'Telebirr', value: 'telebirr' },
        { label: 'CBE Birr', value: 'cbe_birr' },
      ],
      index: true,
    },
    {
      name: 'payment_reference',
      type: 'text',
      admin: { description: 'Transaction reference number user provided.' },
    },
    {
      name: 'payment_screenshot',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description:
          "Screenshot proof of payment (optional). Users who can't upload submit without it and DM the screenshot to admin on Telegram.",
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Verified', value: 'verified' },
        { label: 'Rejected', value: 'rejected' },
      ],
      index: true,
    },
    {
      name: 'admin_note',
      type: 'textarea',
      admin: { description: 'Visible to the user on their /dashboard/requests page.' },
    },
    {
      name: 'verified_by',
      type: 'relationship',
      relationTo: 'admins',
      admin: { readOnly: true },
    },
    { name: 'verified_at', type: 'date', admin: { readOnly: true } },
    {
      name: 'download_expires_at',
      type: 'date',
      admin: { readOnly: true, description: 'Set to +30 days when status flips to verified.' },
    },
    {
      name: 'download_count',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, description: 'Incremented on every successful download.' },
    },
    {
      name: 'fulfilled_asset',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'For custom requests: the PDF/asset the admin procured (from MOR, Trade Bureau, etc.) and uploaded. Users hit /api/downloads/<id> to fetch it once status = verified.',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Enforce the conditional-required rule that Payload can't do natively:
        // catalog requests need a report, custom requests need a title.
        if (!data) return data
        if (data.request_type === 'catalog' && !data.report) {
          throw new Error('report is required for a catalog request')
        }
        if (data.request_type === 'custom' && !data.custom_title) {
          throw new Error('custom_title is required for a custom request')
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req }) => {
        // Auto-populate verified metadata when the admin flips status to 'verified'.
        const wasVerified = originalDoc?.status === 'verified'
        const isNowVerified = data.status === 'verified'
        if (isNowVerified && !wasVerified) {
          data.verified_at = new Date().toISOString()
          data.verified_by = req.user?.id ?? data.verified_by
          if (!data.download_expires_at) {
            const thirty = new Date()
            thirty.setDate(thirty.getDate() + 30)
            data.download_expires_at = thirty.toISOString()
          }
        }
        return data
      },
    ],
    /** Fire an email to the user when their request transitions to
     *  verified or rejected. Runs after the doc is persisted so we
     *  send exactly the terminal state, not intermediate drafts.
     *  Wrapped in try/catch — email failure never blocks the admin
     *  action. Uses a lazy import so the collection file stays
     *  cheap at boot time. */
    afterChange: [
      async ({ doc, previousDoc }) => {
        try {
          const wasFinal =
            previousDoc?.status === 'verified' || previousDoc?.status === 'rejected'
          const isFinal = doc.status === 'verified' || doc.status === 'rejected'
          if (!isFinal || wasFinal) return

          const { sendEmail } = await import('../../lib/email')
          const { Pool } = await import('pg')
          const { normalizeDatabaseUrl } = await import('../../lib/db-url')

          const pool = new Pool({
            connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
            max: 1,
          })
          const res = await pool.query<{ email: string; name: string | null }>(
            'SELECT email, name FROM "user" WHERE id = $1 LIMIT 1',
            [doc.user_id],
          )
          await pool.end()
          const target = res.rows[0]
          if (!target) return

          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
            'https://biz.doxaplc.com'
          const title =
            doc.custom_title ??
            (typeof doc.report === 'object' && doc.report?.title) ??
            'your report request'

          if (doc.status === 'verified') {
            await sendEmail({
              to: target.email,
              subject: `[BizBridge] "${title}" verified — download ready`,
              text:
                `Hi ${target.name ?? 'there'},\n\n` +
                `Your request "${title}" has been verified. The download is unlocked for the next 30 days:\n\n` +
                `${appUrl}/dashboard/requests\n\n` +
                `— BizBridge`,
            })
          } else {
            await sendEmail({
              to: target.email,
              subject: `[BizBridge] "${title}" needs another look`,
              text:
                `Hi ${target.name ?? 'there'},\n\n` +
                `We couldn't verify your request "${title}" as submitted. Open the request page to see the reviewer's note and resubmit if needed:\n\n` +
                `${appUrl}/dashboard/requests\n\n` +
                `Reply to this email or DM @cheri_figma on Telegram if you're stuck.\n\n` +
                `— BizBridge`,
            })
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[report-requests] afterChange email failed', err)
        }
      },
    ],
  },
  timestamps: true,
}
