import 'server-only'

/**
 * Minimal email sender. Two backends supported, in order of preference:
 *
 *   1. Resend — set RESEND_API_KEY + RESEND_FROM. Real transactional
 *      email, works out of the box.
 *   2. Telegram admin bridge — set TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID.
 *      Ships the intended email to the admin's Telegram DM so they can
 *      forward manually. Useful as a stop-gap when no email provider is
 *      configured — matches the "user sends payment screenshot via
 *      Telegram" pattern already used elsewhere in BizBridge.
 *   3. Fall-through: log to console. Dev-only surface; production callers
 *      should treat a `console-only` result as a soft failure and tell
 *      the user to contact support directly.
 *
 * Never throws — always returns a result so callers can decide whether
 * to expose "check your inbox" vs. "email delivery isn't set up yet".
 */
export interface SendEmailInput {
  to: string
  subject: string
  /** Plain-text body. Callers can pass Markdown; we don't render HTML. */
  text: string
}

export type SendEmailResult =
  | { ok: true; via: 'resend' | 'telegram' | 'console' }
  | { ok: false; error: string }

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const via = pickBackend()

  try {
    if (via === 'resend') return await sendViaResend(input)
    if (via === 'telegram') return await sendViaTelegram(input)
    return sendViaConsole(input)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] send failed', err)
    return { ok: false, error: (err as Error).message ?? 'unknown' }
  }
}

function pickBackend(): 'resend' | 'telegram' | 'console' {
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) return 'resend'
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID) return 'telegram'
  return 'console'
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, error: `resend ${res.status}: ${body.slice(0, 200)}` }
  }
  return { ok: true, via: 'resend' }
}

async function sendViaTelegram(input: SendEmailInput): Promise<SendEmailResult> {
  const body = [
    `📧 *Outgoing email (admin bridge)*`,
    ``,
    `*To:* \`${input.to}\``,
    `*Subject:* ${input.subject}`,
    ``,
    input.text,
  ].join('\n')
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
        text: body,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    },
  )
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    return { ok: false, error: `telegram ${res.status}: ${errBody.slice(0, 200)}` }
  }
  return { ok: true, via: 'telegram' }
}

function sendViaConsole(input: SendEmailInput): SendEmailResult {
  // eslint-disable-next-line no-console
  console.info(
    `[email:console]\n  to: ${input.to}\n  subject: ${input.subject}\n${input.text
      .split('\n')
      .map((l) => `  | ${l}`)
      .join('\n')}`,
  )
  return { ok: true, via: 'console' }
}
