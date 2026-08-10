/**
 * Featured partner directory. Real local operators we send our customers to.
 * `logoUrl` — when set, PartnerCard/BrandMark renders the actual logo instead
 * of the initials fallback. Domains listed here must be added to
 * next.config.ts `images.remotePatterns` or Next will refuse to optimise them.
 */

export type PartnerCategory =
  | 'hospitality'
  | 'logistics'
  | 'software'
  | 'legal'
  | 'accounting'
  | 'marketing'

export interface Partner {
  slug: string
  name: string
  tagline: string
  description: string
  category: PartnerCategory
  /** External site — empty string when the operator has no site; UI hides the link. */
  url: string
  /** Optional contact endpoints when there's no external URL. */
  telegram?: string
  instagram?: string
  city: string
  /** Initials shown as a brand mark when we don't have a real logo asset. */
  initials: string
  /** Optional tint for the brand mark. */
  tint?: 'brand' | 'warm' | 'cool' | 'sand'
  /** Absolute URL to a logo image. When set, replaces the initials tile. */
  logoUrl?: string
  featured?: boolean
}

export const PARTNERS: Partner[] = [
  {
    slug: 'fida-delivery',
    name: 'Fida Delivery',
    tagline: 'Deliver anything, anywhere in Bishoftu',
    description:
      'On-demand delivery network for Bishoftu — food, retail, courier, last-mile. Customer + rider apps, live dispatch, real-time SOS. Local operators can list in minutes.',
    category: 'logistics',
    url: 'https://fidadelivery.com',
    city: 'Bishoftu',
    initials: 'Fd',
    tint: 'warm',
    logoUrl: 'https://fidadelivery.com/apple-icon.png',
    featured: true,
  },
  {
    slug: 'doxa-innovations',
    name: 'Doxa Innovations',
    tagline: 'Software studio for Ethiopian operators',
    description:
      'End-to-end product studio — web, mobile, backend, deployment. Builds the tech spine behind Fida Delivery, Classic Noodle, and other local businesses. Design, engineering, and post-launch support under one roof.',
    category: 'software',
    url: 'https://doxaplc.com',
    city: 'Bishoftu',
    initials: 'Dx',
    tint: 'brand',
    logoUrl: 'https://cdn.doxaplc.com/doxa-public/logo.png',
    featured: true,
  },
  {
    slug: 'classic-noodle',
    name: 'Classic Noodle',
    tagline: 'Asian-fusion noodle house',
    description:
      'Fast-casual noodles in Bishoftu — hand-pulled bowls, wok-fried rice, and dumplings. Online ordering via a Doxa-built stack; delivery partnered through Fida.',
    category: 'hospitality',
    url: 'https://classicnoodle.com',
    city: 'Bishoftu',
    initials: 'CN',
    tint: 'warm',
    logoUrl: 'https://cdn.doxaplc.com/doxa-public/classic_logo.png',
    featured: true,
  },
  {
    slug: 'br-photography',
    name: 'BR Photography',
    tagline: 'Brand + event photography, Bishoftu & Addis',
    description:
      'Product, brand, and event photography for hospitality and retail launches. Menu shoots, portraits, on-location work. Reach out via Telegram.',
    category: 'marketing',
    url: '',
    telegram: 'https://t.me/Cherireal7',
    city: 'Bishoftu',
    initials: 'BR',
    tint: 'cool',
    featured: true,
  },
]

export const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  hospitality: 'Hospitality · F&B',
  logistics: 'Logistics · Delivery',
  software: 'Software · IT',
  legal: 'Legal · Compliance',
  accounting: 'Accounting · Tax',
  marketing: 'Marketing · Branding',
}

export const CATEGORY_ORDER: PartnerCategory[] = [
  'hospitality',
  'logistics',
  'software',
  'legal',
  'accounting',
  'marketing',
]
