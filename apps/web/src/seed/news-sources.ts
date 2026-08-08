/**
 * Curated Ethiopian business news / operators feed. Idempotent upsert by url.
 * Cheri can extend this list at will; new entries are added on the next run,
 * existing entries are updated in place.
 *
 *   pnpm tsx src/seed/news-sources.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

type Type =
  | 'news_site'
  | 'newspaper'
  | 'tv'
  | 'youtube'
  | 'telegram'
  | 'gov_portal'
  | 'economic_data'

type Category = 'business' | 'policy' | 'finance' | 'sector_specific' | 'general'

interface Source {
  name: string
  type: Type
  url: string
  handle?: string
  category: Category
  description_en?: string
  description_am?: string
  priority?: number
  allow_scrape?: boolean
  subscribers?: number
}

const SOURCES: Source[] = [
  // ----- Telegram channels (Ethiopian business + legal + tech) ------------
  {
    name: 'Tebeka Samuel — Business Law',
    type: 'telegram',
    url: 'https://t.me/tebekasamuel',
    handle: 'tebekasamuel',
    category: 'policy',
    description_en:
      'Attorney Samuel Girma explains Ethiopian business law in plain Amharic — contracts, licensing, tax, disputes.',
    description_am: 'ጠበቃ ሳሙኤል ግርማ ሕግን በአማርኛ ያብራራል — ውል፣ ፈቃድ፣ ግብር፣ ክርክሮች።',
    priority: 90,
    allow_scrape: true,
    subscribers: 133000,
  },
  {
    name: 'Addis Standard',
    type: 'telegram',
    url: 'https://t.me/addisstandard',
    handle: 'addisstandard',
    category: 'general',
    description_en:
      'Independent Ethiopian news outlet — politics, economy, business, in English.',
    priority: 80,
    allow_scrape: true,
  },
  {
    name: 'Capital Ethiopia',
    type: 'telegram',
    url: 'https://t.me/capitalethiopia',
    handle: 'capitalethiopia',
    category: 'business',
    description_en:
      'Business weekly covering Ethiopian markets, deals, and corporate news.',
    priority: 85,
    allow_scrape: true,
  },
  {
    name: 'Reporter Ethiopia',
    type: 'telegram',
    url: 'https://t.me/reporterethiopia',
    handle: 'reporterethiopia',
    category: 'general',
    description_en: 'Ethiopian daily — politics, business, macro.',
    priority: 75,
    allow_scrape: true,
  },
  {
    name: 'Ethio Business',
    type: 'telegram',
    url: 'https://t.me/ethiobusiness',
    handle: 'ethiobusiness',
    category: 'business',
    description_en: 'Ethiopian business news, tenders, market briefs in Amharic + English.',
    priority: 78,
    allow_scrape: true,
  },
  {
    name: 'Ministry of Revenue Ethiopia',
    type: 'telegram',
    url: 'https://t.me/moretaxethiopia',
    handle: 'moretaxethiopia',
    category: 'policy',
    description_en: 'Official MOR announcements — tax deadlines, VAT circulars, TIN notices.',
    priority: 95,
    allow_scrape: false,
  },

  // ----- News sites ------------------------------------------------------
  {
    name: 'Addis Fortune',
    type: 'news_site',
    url: 'https://addisfortune.news',
    category: 'business',
    description_en: 'English-language weekly with Ethiopia\'s deepest business coverage.',
    priority: 90,
  },
  {
    name: 'The Reporter — English',
    type: 'news_site',
    url: 'https://www.thereporterethiopia.com',
    category: 'general',
    description_en: 'English-language edition of Reporter Ethiopia.',
    priority: 80,
  },
  {
    name: 'Ethiopian Business Review',
    type: 'news_site',
    url: 'https://ebrmagazine.com',
    category: 'business',
    description_en: 'Monthly business magazine — sector features, interviews, macro analysis.',
    priority: 75,
  },
  {
    name: 'Shega Media',
    type: 'news_site',
    url: 'https://shega.co',
    category: 'business',
    description_en: 'Ethiopian tech + business media — startups, fintech, policy.',
    priority: 88,
  },
  {
    name: 'Ethiopian Monitor',
    type: 'news_site',
    url: 'https://ethiopianmonitor.com',
    category: 'general',
    description_en: 'English-language Ethiopian news aggregator.',
    priority: 60,
  },

  // ----- YouTube ---------------------------------------------------------
  {
    name: 'Shega TV',
    type: 'youtube',
    url: 'https://www.youtube.com/@shegatv',
    handle: 'shegatv',
    category: 'business',
    description_en: 'Founder interviews, business explainers, and market deep-dives.',
    priority: 80,
  },
  {
    name: 'Addis Zeybe',
    type: 'youtube',
    url: 'https://www.youtube.com/@addiszeybe',
    handle: 'addiszeybe',
    category: 'business',
    description_en: 'Interviews with Ethiopian entrepreneurs and thought leaders in Amharic.',
    priority: 78,
  },

  // ----- Government portals + regulators --------------------------------
  {
    name: 'Ministry of Revenue',
    type: 'gov_portal',
    url: 'https://mor.gov.et',
    category: 'policy',
    description_en:
      'Tax registration (TIN), VAT, business tax filing. Where MOR sector codes are administered.',
    priority: 100,
  },
  {
    name: 'Ministry of Trade & Regional Integration',
    type: 'gov_portal',
    url: 'https://motri.gov.et',
    category: 'policy',
    description_en: 'Business licensing, standards, trade regulations.',
    priority: 95,
  },
  {
    name: 'Ethiopian Investment Commission',
    type: 'gov_portal',
    url: 'https://investethiopia.gov.et',
    category: 'policy',
    description_en:
      'Foreign investment approvals, sector guidelines, capital-threshold rules for FDI.',
    priority: 92,
  },
  {
    name: 'eTrade portal',
    type: 'gov_portal',
    url: 'https://etrade.gov.et',
    category: 'policy',
    description_en:
      'One-stop trade licensing — reserve business names, apply for trade licences online.',
    priority: 96,
  },
  {
    name: 'National Bank of Ethiopia',
    type: 'gov_portal',
    url: 'https://nbebank.com',
    category: 'finance',
    description_en:
      'Ethiopia\'s central bank. Publishes daily FX rate, monetary policy, banking directives.',
    priority: 98,
  },
  {
    name: 'Ethiopian Customs Commission',
    type: 'gov_portal',
    url: 'https://www.ecc.gov.et',
    category: 'policy',
    description_en: 'Import/export tariffs, HS-code lookup, customs procedures.',
    priority: 82,
  },

  // ----- Economic data ---------------------------------------------------
  {
    name: 'Central Statistics Agency (CSA)',
    type: 'economic_data',
    url: 'https://www.statsethiopia.gov.et',
    category: 'finance',
    description_en:
      'Official Ethiopian statistics — inflation, employment, industrial output, agricultural production.',
    priority: 90,
  },
  {
    name: 'World Bank — Ethiopia',
    type: 'economic_data',
    url: 'https://data.worldbank.org/country/ethiopia',
    category: 'finance',
    description_en:
      'Cross-national economic indicators for Ethiopia — GDP, poverty, trade balance.',
    priority: 75,
  },
]

async function main() {
  console.log('Booting Payload…')
  const payload = await getPayload({ config: await config })

  let created = 0
  let updated = 0

  for (const src of SOURCES) {
    const existing = await payload.find({
      collection: 'news-sources',
      where: { url: { equals: src.url } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const id = existing.docs[0]!.id
      await payload.update({
        collection: 'news-sources',
        id,
        data: {
          name: src.name,
          type: src.type,
          url: src.url,
          handle: src.handle ?? undefined,
          category: src.category,
          description_en: src.description_en ?? undefined,
          description_am: src.description_am ?? undefined,
          priority: src.priority ?? 50,
          allow_scrape: src.allow_scrape ?? false,
          subscribers: src.subscribers ?? undefined,
          is_active: true,
        },
      })
      updated += 1
    } else {
      await payload.create({
        collection: 'news-sources',
        data: {
          name: src.name,
          type: src.type,
          url: src.url,
          handle: src.handle ?? undefined,
          category: src.category,
          description_en: src.description_en ?? undefined,
          description_am: src.description_am ?? undefined,
          priority: src.priority ?? 50,
          allow_scrape: src.allow_scrape ?? false,
          subscribers: src.subscribers ?? undefined,
          is_active: true,
        },
      })
      created += 1
    }
  }

  console.log(`\nDone. created=${created}, updated=${updated}, total=${SOURCES.length}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
