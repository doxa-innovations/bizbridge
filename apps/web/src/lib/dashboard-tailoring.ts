/**
 * Pure tailoring logic for the /dashboard experience. Given a user, returns
 * a config describing how the dashboard should shape itself: which greeting
 * to show, which tools to pin, which sections to hide, which filters to
 * default the Pulse feed to. Consumed by the dashboard home tile + Pulse.
 *
 * Kept as a pure function so it's trivial to test and easy to reason about.
 */
import type { CurrentUser } from './auth-server'

export type Recommendation = {
  href: string
  label: string
  hint: string
}

export type PulseTypeFilter =
  | 'news_site'
  | 'newspaper'
  | 'tv'
  | 'youtube'
  | 'telegram'
  | 'gov_portal'
  | 'economic_data'

export type CapitalTier = 'solo' | 'micro' | 'small' | 'medium' | 'investment'

export interface DashboardConfig {
  greeting: string
  copy: {
    trioBudgetTitle: string
    trioReportsTitle: string
    trioPulseTitle: string
  }
  recommendations: Recommendation[]
  hiddenModules: Set<'bishoftu' | 'lawyer' | 'partners' | 'consult'>
  pulseDefaultFilters: PulseTypeFilter[]
  suggestQuery: string // e.g. ?tier=medium
}

const CAPITAL_TIER_LABEL: Record<CapitalTier, { label: string; range: string; vibe: string }> = {
  solo: { label: 'Solo', range: 'ETB 30k – 300k', vibe: 'Home-based / side hustle' },
  micro: { label: 'Micro', range: 'ETB 300k – 2M', vibe: 'Kiosk, small crew' },
  small: { label: 'Small', range: 'ETB 2M – 15M', vibe: 'Proper shop or small team' },
  medium: { label: 'Medium', range: 'ETB 15M – 150M', vibe: 'Hotel, factory, exporter' },
  investment: { label: 'Investment-tier', range: 'ETB 150M+', vibe: 'EIC-registered' },
}

function timeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getDashboardConfig(user: CurrentUser): DashboardConfig {
  const firstName =
    (user.fullName ?? user.name ?? '').split(' ')[0]?.trim() || user.email.split('@')[0]
  const isEthiopia = (user.country ?? 'ET').toUpperCase() === 'ET'
  const userType = user.userType
  const tier = user.capitalTier
  const cats = user.interestCategories ?? []

  const hidden = new Set<'bishoftu' | 'lawyer' | 'partners' | 'consult'>()
  const recommendations: Recommendation[] = []
  const pulseDefaultFilters: PulseTypeFilter[] = []

  // -------- Greeting --------------------------------------------------------
  let greeting: string
  if (userType === 'diaspora') {
    greeting = user.country
      ? `Welcome back from ${user.country}, ${firstName}`
      : `Welcome back, ${firstName}`
  } else if (userType === 'foreign_investor') {
    greeting = `${timeGreeting()}, ${firstName}`
  } else if (isEthiopia && (user.locale === 'am' || cats.includes('agriculture-hunting-forestry-fishing'))) {
    greeting = `እንደምን ዋሉ, ${firstName}`
  } else {
    greeting = `${timeGreeting()}, ${firstName}`
  }

  // -------- Trio card copy -------------------------------------------------
  const tierMeta = tier ? CAPITAL_TIER_LABEL[tier] : null
  const trioBudgetTitle = tierMeta
    ? `For your budget (${tierMeta.range})`
    : 'Pick a budget for tailored picks'

  const isSoftware = cats.includes('finance-insurance-real-estate-business') ||
    (user.interestSectors ?? []).some((code) => code.startsWith('391'))
  const trioReportsTitle = cats.length > 0
    ? `Reports for your sectors`
    : 'Reports catalog'

  const trioPulseTitle = isEthiopia ? 'Ethiopia today' : 'Ethiopia this week'

  // -------- Tailoring rules ------------------------------------------------
  if (userType === 'diaspora') {
    // Diaspora priorities: legal + partners + calculator, hide city-specific
    hidden.add('bishoftu')
    recommendations.push(
      { href: '/partners', label: 'Local partners', hint: 'Vetted Bishoftu / Oromia operators for JV or intros' },
      { href: '/lawyer', label: 'Talk to a lawyer', hint: 'Repatriation contracts + FDI structuring' },
      { href: '/calculator?scenario=diaspora-swe', label: 'Cost calculator', hint: 'Diaspora-adjusted fee schedule' },
    )
    pulseDefaultFilters.push('telegram', 'youtube', 'gov_portal')
  } else if (userType === 'foreign_investor') {
    // FDI priorities: EIC-heavy, legal, industrial
    recommendations.push(
      { href: '/services', label: 'FDI overview', hint: 'EIC thresholds, restricted sectors, capital tiers' },
      { href: '/lawyer', label: 'Talk to a lawyer', hint: 'FDI structuring, IP, dispute clauses' },
      { href: '/partners', label: 'Local partners', hint: 'JV shortcuts + operators on the ground' },
    )
    pulseDefaultFilters.push('gov_portal', 'economic_data', 'news_site')
  } else {
    // Local Ethiopian entrepreneur — most common. Path: checklist → calculator → resources.
    recommendations.push(
      { href: '/checklist', label: 'Setup checklist', hint: '8 steps from TIN to trade licence' },
      { href: '/calculator?tier=' + (tier ?? 'micro'), label: 'Cost calculator', hint: 'Real ETB fees at your budget' },
      { href: '/resources', label: 'Legal resources', hint: 'Amharic explainers + gov portals' },
    )
    // Local micro / solo tier rarely needs a lawyer; swap for consult
    if (tier === 'solo' || tier === 'micro') {
      hidden.add('lawyer')
    }
    pulseDefaultFilters.push('telegram', 'gov_portal')
    if (isEthiopia) {
      // Local users see the city-scoped tile
      // (bishoftu is not hidden)
    }
  }

  // -------- Suggest deeplink --------------------------------------------
  const suggestQuery = tier ? `?tier=${tier}` : ''

  return {
    greeting,
    copy: {
      trioBudgetTitle,
      trioReportsTitle,
      trioPulseTitle,
    },
    recommendations,
    hiddenModules: hidden,
    pulseDefaultFilters,
    suggestQuery,
  }
}

export const CAPITAL_TIER_META = CAPITAL_TIER_LABEL
