/**
 * FX rates helper — pulls USD-base rates from the free/no-key
 * open.er-api.com tier (updated daily). Cached at the fetch layer
 * for 6h so a single deploy usually makes 4 upstream requests per day.
 *
 * NBE reference rates would be more "official" but their WordPress
 * page needs headless rendering to scrape. Market rates are also
 * more useful to the diaspora/investor persona, who care about what
 * they actually receive on Wise/hawala, not the NBE reference number.
 */

export interface FxRates {
  base: 'USD'
  rates: {
    ETB: number
    EUR: number
    GBP: number
    CAD: number
    AUD: number
    SAR: number
    AED: number
  }
  fetchedAt: string
  source: string
}

const REVALIDATE_SECONDS = 6 * 60 * 60

const FALLBACK: FxRates = {
  base: 'USD',
  rates: {
    ETB: 161,
    EUR: 0.86,
    GBP: 0.74,
    CAD: 1.39,
    AUD: 1.41,
    SAR: 3.75,
    AED: 3.67,
  },
  fetchedAt: '',
  source: 'fallback',
}

export async function getFxRates(): Promise<FxRates> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: REVALIDATE_SECONDS, tags: ['fx'] },
    })
    if (!res.ok) return FALLBACK
    const data = (await res.json()) as {
      result?: string
      rates?: Record<string, number>
      time_last_update_utc?: string
    }
    if (data.result !== 'success' || !data.rates?.ETB) return FALLBACK
    return {
      base: 'USD',
      rates: {
        ETB: data.rates.ETB,
        EUR: data.rates.EUR ?? FALLBACK.rates.EUR,
        GBP: data.rates.GBP ?? FALLBACK.rates.GBP,
        CAD: data.rates.CAD ?? FALLBACK.rates.CAD,
        AUD: data.rates.AUD ?? FALLBACK.rates.AUD,
        SAR: data.rates.SAR ?? FALLBACK.rates.SAR,
        AED: data.rates.AED ?? FALLBACK.rates.AED,
      },
      fetchedAt: data.time_last_update_utc ?? new Date().toUTCString(),
      source: 'exchangerate-api.com',
    }
  } catch {
    return FALLBACK
  }
}

/**
 * Convert a foreign-currency amount to ETB using the supplied rates.
 * Rates are USD-base: X per USD. To go FROM currency C TO ETB:
 *   amount_in_c / rates[C] * rates.ETB
 */
export function convertToEtb(
  amount: number,
  from: keyof FxRates['rates'] | 'USD',
  rates: FxRates,
): number {
  if (from === 'USD') return amount * rates.rates.ETB
  const perUsd = rates.rates[from]
  if (!perUsd) return amount * rates.rates.ETB
  return (amount / perUsd) * rates.rates.ETB
}
