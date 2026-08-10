import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { BusinessSectors } from './payload/collections/BusinessSectors'
import { SectorCategories } from './payload/collections/SectorCategories'
import { SectorLicenseRequirements } from './payload/collections/SectorLicenseRequirements'
import { SectorCompetencyCertificates } from './payload/collections/SectorCompetencyCertificates'
import { SectorApprovals } from './payload/collections/SectorApprovals'
import { SectorCosts } from './payload/collections/SectorCosts'
import { SectorSteps } from './payload/collections/SectorSteps'
import { SectorDocuments } from './payload/collections/SectorDocuments'
import { Reports } from './payload/collections/Reports'
import { Experts } from './payload/collections/Experts'
import { MarketResearch } from './payload/collections/MarketResearch'
import { Pages } from './payload/collections/Pages'
import { BlogPosts } from './payload/collections/BlogPosts'
import { Media } from './payload/collections/Media'
import { Admins } from './payload/collections/Admins'
import { SavedSectors } from './payload/collections/SavedSectors'
import { SavedReports } from './payload/collections/SavedReports'
import { UserChecklists } from './payload/collections/UserChecklists'
import { ReportRequests } from './payload/collections/ReportRequests'
import { NewsSources } from './payload/collections/NewsSources'

import { SiteSettings } from './payload/globals/SiteSettings'
import { HomepageContent } from './payload/globals/HomepageContent'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const r2Enabled = Boolean(
  process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ENDPOINT,
)

// Payment screenshots (report-requests upload flow) need durable storage in
// production — the Dokploy filesystem is ephemeral, so a container restart
// would nuke them. We used to fail-loud at config load if R2 wasn't set, but
// Next's "Collecting page data" phase spawns workers where NEXT_PHASE doesn't
// propagate reliably, which broke `next build`.
//
// Enforcement moved into the actual upload handler (POST /api/report-requests):
// it 503s with a clear message when R2 is missing in prod, so deploys still
// succeed and only the affected surface fails loudly. Boot warning below
// gives ops a heads-up in the log before anyone tries to upload.
if (process.env.NODE_ENV === 'production' && !r2Enabled) {
  // eslint-disable-next-line no-console
  console.warn(
    '[payload] R2 credentials not set — payment screenshot uploads will 503. ' +
      'Set R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_ENDPOINT in Dokploy to fix.',
  )
}

// Normalized in one place — src/lib/db-url.ts explains why.
import { normalizeDatabaseUrl } from './lib/db-url'
const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — BizBridge Admin',
    },
  },
  collections: [
    Admins,
    BusinessSectors,
    SectorCategories,
    SectorLicenseRequirements,
    SectorCompetencyCertificates,
    SectorApprovals,
    SectorCosts,
    SectorSteps,
    SectorDocuments,
    Reports,
    Experts,
    MarketResearch,
    Pages,
    BlogPosts,
    Media,
    // User-scoped collections for the /dashboard experience.
    SavedSectors,
    SavedReports,
    UserChecklists,
    ReportRequests,
    NewsSources,
  ],
  globals: [SiteSettings, HomepageContent],
  editor: lexicalEditor(),
  sharp,
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-do-not-use-in-prod',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
    },
    migrationDir: path.resolve(dirname, 'payload/migrations'),
    push: false,
    schemaName: 'payload',
  }),
  plugins: r2Enabled
    ? [
        s3Storage({
          collections: {
            media: { prefix: 'media' },
            'sector-documents': { prefix: 'sector-documents' },
            reports: { prefix: 'reports' },
          },
          bucket: process.env.R2_BUCKET_NAME as string,
          config: {
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
            },
            region: 'auto',
            forcePathStyle: true,
          },
        }),
      ]
    : [],
  cors: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  ],
  csrf: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ],
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'payload/generated-schema.graphql'),
  },
})
