import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_PENDING_PER_HOUR = 3

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 })
  }

  const requestType = (form.get('requestType') as string) || 'catalog'
  const paymentMethod = form.get('paymentMethod')
  const paymentReference = form.get('paymentReference')
  const screenshot = form.get('screenshot')
  const amountEtbRaw = form.get('amountEtb')

  if (requestType !== 'catalog' && requestType !== 'custom') {
    return NextResponse.json({ error: 'invalid requestType' }, { status: 400 })
  }
  if (paymentMethod !== 'telebirr' && paymentMethod !== 'cbe_birr') {
    return NextResponse.json({ error: 'invalid paymentMethod' }, { status: 400 })
  }
  if (!(screenshot instanceof File)) {
    return NextResponse.json({ error: 'screenshot file required' }, { status: 400 })
  }
  if (!ACCEPTED_MIME.has(screenshot.type)) {
    return NextResponse.json(
      { error: 'screenshot must be PNG, JPEG, or WebP' },
      { status: 415 },
    )
  }
  if (screenshot.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'screenshot exceeds 5 MB' }, { status: 413 })
  }

  const payload = await getPayloadClient()

  // Catalog vs custom: resolve report + pricing accordingly.
  let reportId: number | null = null
  let amountEtb = 0
  let amountUsd: number | undefined = undefined
  let customTitle: string | undefined
  let customSource: string | undefined
  let customNotes: string | undefined

  if (requestType === 'catalog') {
    const reportIdRaw = form.get('reportId')
    if (typeof reportIdRaw !== 'string' || !reportIdRaw) {
      return NextResponse.json({ error: 'reportId required' }, { status: 400 })
    }
    const id = Number.isFinite(Number(reportIdRaw)) ? Number(reportIdRaw) : null
    if (id === null) return NextResponse.json({ error: 'invalid reportId' }, { status: 400 })
    const reportRes = await payload.find({
      collection: 'reports',
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const report = reportRes.docs[0] as { id: number; price_birr?: number; price_usd?: number } | undefined
    if (!report) return NextResponse.json({ error: 'report not found' }, { status: 404 })
    reportId = report.id
    amountEtb = report.price_birr ?? 0
    amountUsd = report.price_usd ?? undefined
  } else {
    // custom
    customTitle = (form.get('customTitle') as string)?.trim()
    customSource = (form.get('customSource') as string) || undefined
    customNotes = (form.get('customNotes') as string) || undefined
    if (!customTitle) {
      return NextResponse.json({ error: 'customTitle required' }, { status: 400 })
    }
    // Amount is optional at submission time — admin fills it from the
    // screenshot at verify. Default to 0 and let the reviewer set the true
    // amount in the Payload admin UI before flipping status to 'verified'.
    const parsedAmount = amountEtbRaw ? Number(amountEtbRaw) : 0
    amountEtb = Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0
  }

  // Rate-limit: max 3 pending requests per user per hour to blunt spam
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const pending = await payload.find({
    collection: 'report-requests',
    where: {
      user_id: { equals: user.id },
      status: { equals: 'pending' },
      createdAt: { greater_than: hourAgo },
    },
    limit: 0,
    overrideAccess: true,
  })
  if (pending.totalDocs >= MAX_PENDING_PER_HOUR) {
    return NextResponse.json(
      {
        error: `Too many pending requests (max ${MAX_PENDING_PER_HOUR} per hour). Wait for an admin to review the existing ones.`,
      },
      { status: 429 },
    )
  }

  // Upload the screenshot into the media collection
  const buffer = Buffer.from(await screenshot.arrayBuffer())
  const media = await payload.create({
    collection: 'media',
    data: {
      alt:
        requestType === 'catalog'
          ? `Payment screenshot for report id ${reportId} — user ${user.id}`
          : `Payment screenshot for custom request "${customTitle}" — user ${user.id}`,
    },
    file: {
      data: buffer,
      mimetype: screenshot.type,
      name: screenshot.name || `payment-${Date.now()}.png`,
      size: screenshot.size,
    },
    overrideAccess: true,
  })

  // Create the request
  const created = await payload.create({
    collection: 'report-requests',
    data: {
      user_id: user.id,
      request_type: requestType,
      ...(reportId ? { report: reportId } : {}),
      ...(customTitle ? { custom_title: customTitle } : {}),
      ...(customSource ? { custom_source: customSource as never } : {}),
      ...(customNotes ? { custom_notes: customNotes } : {}),
      amount_etb: amountEtb,
      amount_usd: amountUsd,
      payment_method: paymentMethod,
      payment_reference: typeof paymentReference === 'string' ? paymentReference : undefined,
      payment_screenshot: Number((media as { id: number | string }).id),
      status: 'pending',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ id: created.id, status: 'pending' }, { status: 201 })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'report-requests',
    where: { user_id: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })
  return NextResponse.json({ requests: res.docs })
}
