import {
  Briefcase,
  Factory,
  HardHat,
  Landmark,
  Pickaxe,
  ShoppingBag,
  Truck,
  Users,
  Wheat,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Category-aware icon tile — lucide-react icon on a subtly tinted swatch,
 * keyed by MOR category slug. Keeps the same API as the old geometric
 * gradient version so call sites don't need to change.
 */

const ICON_MAP: Record<string, LucideIcon> = {
  'agriculture-hunting-forestry-fishing': Wheat,
  'mining-and-quarrying': Pickaxe,
  'manufacturing': Factory,
  'electricity-gas-water-waste': Zap,
  'construction': HardHat,
  'wholesale-retail-hotels-import-export': ShoppingBag,
  'transport-storage-communication': Truck,
  'finance-insurance-real-estate-business': Landmark,
  'community-social-personal-services': Users,
}

// Matches the palette in home-charts.tsx — keep in sync manually.
const TINT_MAP: Record<string, string> = {
  'agriculture-hunting-forestry-fishing': '#3f6b52',
  'mining-and-quarrying': '#8a6a3d',
  'manufacturing': '#c66a3a',
  'electricity-gas-water-waste': '#3a8f9c',
  'construction': '#a05c50',
  'wholesale-retail-hotels-import-export': '#2D8F72',
  'transport-storage-communication': '#4c6ea8',
  'finance-insurance-real-estate-business': '#a48242',
  'community-social-personal-services': '#7d5e88',
}

interface GeometricIconProps {
  slug: string
  className?: string
}

export function GeometricIcon({ slug, className }: GeometricIconProps) {
  const Icon = ICON_MAP[slug] ?? Briefcase
  const tint = TINT_MAP[slug] ?? '#2D8F72'

  return (
    <div
      className={cn(
        'relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md',
        'border border-border',
        className,
      )}
      style={{
        backgroundColor: `${tint}18`,
        borderColor: `${tint}40`,
      }}
      aria-hidden
    >
      <Icon className="h-[55%] w-[55%]" style={{ color: tint }} strokeWidth={1.75} />
    </div>
  )
}
