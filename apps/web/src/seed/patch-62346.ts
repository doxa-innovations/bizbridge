/**
 * One-off patch for sector 62346 which has no permitted_operations_am or _en
 * rows because the source PDF folded its explanation into the name column.
 * Populate both from the matched sibling sector 62341.
 *
 *   pnpm tsx src/seed/patch-62346.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

const AM_TEXT =
  'ይህ የስራ ዘርፍ ለየትኛውም አይነት ህክምና ያሚውሉ መሳሪያዎችን እና መለዋዎጫዎችን በችርቻሮ መሸጥን ያጠቃልላል፡፡ ለቀዶ ጥገና ህክምና እና ለአጥንት ህክምና የሚያገለግሉ መሣሪያዎችና መለዋወጫዎችን ይጨምራል፡፡'
const EN_TEXT =
  'Retail of medical instruments and accessories used in any type of medical treatment — including surgical and orthopaedic medical equipment.'

process.on('uncaughtException', (err) => {
  if (/Connection|ETIMEDOUT|ECONNRESET|terminated/i.test(err.message)) {
    console.warn('swallowed pool error:', err.message.slice(0, 100))
    return
  }
  console.error(err)
  process.exit(1)
})

async function main() {
  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'business-sectors',
    where: { mor_code: { equals: '62346' } },
    limit: 1,
  })
  const sector = found.docs[0]
  if (!sector) throw new Error('62346 not found')

  await payload.update({
    collection: 'business-sectors',
    id: sector.id,
    data: {
      permitted_operations_am: [{ text: AM_TEXT }],
      permitted_operations_en: [{ text: EN_TEXT }],
    },
  })
  console.log('62346 patched with AM + EN op.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
