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
      required: true,
      admin: { description: 'Screenshot proof of the payment; PNG / JPEG / WebP up to 5MB.' },
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
  ],
  hooks: {
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
  },
  timestamps: true,
}
