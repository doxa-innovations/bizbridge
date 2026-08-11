/**
 * ISO 3166-1 alpha-2 country code list. Country names are resolved at
 * runtime via `Intl.DisplayNames` so we don't have to hardcode 250
 * translations — the browser (and Node 18+) already knows them.
 *
 * A short "priority" list is surfaced at the top of the picker because
 * BizBridge is Ethiopia-focused and most signups come from ET, the
 * common diaspora destinations, and the common foreign-investor
 * origins. Everything else is alphabetical by localised name.
 */

export const COUNTRY_CODES: string[] = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR',
  'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV',
  'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS',
  'GT', 'GU', 'GW', 'GY',
  'HK', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR',
  'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR',
  'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW',
]

/** Bumped to the top of the picker — Ethiopia, common diaspora
 *  destinations, and common foreign-investor origins. */
export const PRIORITY_COUNTRY_CODES: string[] = [
  'ET', // home
  'US', 'CA', 'GB', 'AU', 'DE', 'IT', 'SE', 'NO', 'IL', 'ZA', // diaspora
  'AE', 'SA', 'QA', 'KW', 'CN', 'IN', 'TR', 'NL', 'CH', 'JP', // investor origins
  'KE', 'DJ', 'SO', 'SD', 'ER', // neighbours
]

/** Cached `Intl.DisplayNames` instance — expensive to construct. */
let displayNames: Intl.DisplayNames | null = null
function getDisplayNames(): Intl.DisplayNames {
  if (!displayNames) {
    displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
  }
  return displayNames
}

export interface CountryOption {
  code: string
  name: string
  priority: boolean
}

/** Ordered list of every ISO 3166-1 country as { code, name }. Priority
 *  codes surface first (in the order they're listed above), then the
 *  rest alphabetically by localised name. */
export function getCountryOptions(): CountryOption[] {
  const dn = getDisplayNames()
  const priority = PRIORITY_COUNTRY_CODES
    .filter((c) => COUNTRY_CODES.includes(c))
    .map<CountryOption>((code) => ({
      code,
      name: dn.of(code) ?? code,
      priority: true,
    }))
  const prioritySet = new Set(PRIORITY_COUNTRY_CODES)
  const rest = COUNTRY_CODES
    .filter((c) => !prioritySet.has(c))
    .map<CountryOption>((code) => ({
      code,
      name: dn.of(code) ?? code,
      priority: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return [...priority, ...rest]
}

/** Look up a country name by ISO code. Returns the code itself as a
 *  fallback so misconfigurations don't render blank. */
export function countryName(code: string | null | undefined): string {
  if (!code) return ''
  try {
    return getDisplayNames().of(code) ?? code
  } catch {
    return code
  }
}
