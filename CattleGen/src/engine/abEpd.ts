/**
 * USMARC 2024 Across-Breed EPD (AB-EPD) Adjustment Factors.
 *
 * Source: USDA-ARS USMARC 2024 Across-Breed EPD table (18-breed evaluation).
 * Add these constants to a breed-specific EPD to convert it to the common
 * Angus-base scale, enabling approximate cross-breed comparisons.
 *
 * Covered traits: BW, WW, YW, Milk, Marb (USDA scale), RE, Fat.
 * Brahman Marb values must be normalized (÷ marblingScaleMultiplier = 100)
 * to the USDA scale before the adjustment is applied.
 *
 * Angus is the reference breed — all adjustments are relative to Angus base.
 */

export const AB_EPD_TRAIT_KEYS = ['BW', 'WW', 'YW', 'Milk', 'Marb', 'RE', 'Fat'] as const
export type AbEpdTraitKey = (typeof AB_EPD_TRAIT_KEYS)[number]

// Adjustment constants: AB-EPD = breed EPD + factor
const ADJUSTMENTS: Record<string, Record<AbEpdTraitKey, number>> = {
  angus:      { BW:  0.0, WW:   0.0, YW:  0.0, Milk:  0.0, Marb: 0.00, RE: 0.00, Fat:  0.00 },
  red_angus:  { BW:  0.5, WW:  -0.6, YW:  3.4, Milk: -0.4, Marb: 0.03, RE: 0.01, Fat: -0.01 },
  hereford:   { BW:  1.7, WW:   9.3, YW: 15.0, Milk:  3.8, Marb: 0.09, RE: 0.04, Fat:  0.00 },
  simmental:  { BW:  2.1, WW:  18.5, YW: 31.7, Milk:  4.9, Marb: 0.28, RE: 0.15, Fat: -0.01 },
  limousin:   { BW: -1.0, WW:  16.3, YW: 27.8, Milk:  5.3, Marb: 0.31, RE: 0.13, Fat: -0.02 },
  brahman:    { BW:  4.7, WW:  29.4, YW: 58.7, Milk: -8.0, Marb: 0.33, RE: 0.06, Fat: -0.02 },
  beefmaster: { BW:  3.5, WW:  14.5, YW: 24.9, Milk: -0.1, Marb: 0.16, RE: 0.04, Fat: -0.01 },
}

export function hasAbEpdAdjustments(breedId: string): boolean {
  return breedId in ADJUSTMENTS
}

/**
 * Convert normalized breed-specific EPDs to the common Angus-base AB-EPD scale.
 * Only the 7 covered traits are modified; all others pass through unchanged.
 */
export function applyAbEpdAdjustments(
  normalizedEpds: Record<string, number | null>,
  breedId: string
): Record<string, number | null> {
  const adj = ADJUSTMENTS[breedId]
  if (!adj) return { ...normalizedEpds }
  const result: Record<string, number | null> = { ...normalizedEpds }
  for (const trait of AB_EPD_TRAIT_KEYS) {
    const val = result[trait]
    if (typeof val === 'number') {
      result[trait] = val + adj[trait]
    }
  }
  return result
}
