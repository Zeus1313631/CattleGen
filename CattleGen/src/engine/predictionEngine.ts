/**
 * CattleGen — Progeny Prediction Engine.
 *
 * Core method: Parent Average.
 * Industry-standard formula: ProgenyEPD = (SireEPD + DamEPD) / 2.
 * If one parent EPD is missing, fall back to (knownParent + breedAverage) / 2.
 *
 * CROSS-SYSTEM GUARDRAIL:
 *   EPDs (US) and WBVs (AWA-AU) use different base populations, scales, and
 *   unit systems. The engine must refuse to parent-average across systems and
 *   the UI surfaces an explicit warning to the user.
 *
 * BRAHMAN MARBLING EXCEPTION:
 *   If breedConfig.marblingScaleMultiplier is defined (Brahman: 100), divide
 *   the Brahman Marb value by the multiplier before comparing to or averaging
 *   with other breeds.
 *
 * FUTURE FEATURE NOTE: to enable true cross-breed EPD comparisons, a future
 * version could wire in the USMARC 2024 AB-EPD (Across-Breed EPD) adjustment
 * factors for the 18 breeds covered in that table.
 */

import type {
  Animal,
  BreedConfig,
  ComparisonResult,
  EvaluationSystem,
  MatingPrediction,
  PercentileRange,
  PublicSireRecord,
  WagyuContentLabel,
  WagyuSubtype
} from '../types'

export class CrossEvaluationSystemError extends Error {
  constructor(sireSystem: EvaluationSystem, damSystem: EvaluationSystem) {
    super(
      `Incompatible evaluation systems: sire uses ${sireSystem}, dam uses ${damSystem}. ` +
        `Parent-average predictions across systems are disabled.`
    )
    this.name = 'CrossEvaluationSystemError'
  }
}

// ----------------------------------------------------------------------------
// 1. predictProgeny
// ----------------------------------------------------------------------------

export function predictProgeny(
  sire: Animal,
  dam: Animal,
  breedConfig: BreedConfig,
  options: { customWeights?: Record<string, number>; sireBreed?: BreedConfig; damBreed?: BreedConfig } = {}
): MatingPrediction {
  const sireSystem = options.sireBreed?.evaluationSystem ?? breedConfig.evaluationSystem
  const damSystem = options.damBreed?.evaluationSystem ?? breedConfig.evaluationSystem
  if (sireSystem !== damSystem) {
    throw new CrossEvaluationSystemError(sireSystem, damSystem)
  }

  const predictedProgeny: Record<string, number | null> = {}
  const percentileRankings: Record<string, number> = {}
  const multiplier = breedConfig.marblingScaleMultiplier

  for (const trait of breedConfig.traits) {
    const sireRaw = sire.epds[trait.key]
    const damRaw = dam.epds[trait.key]
    const breedAvg = breedConfig.breedAverages[trait.key]

    const sireVal = normalizeForEngine(sireRaw, trait.key, multiplier)
    const damVal = normalizeForEngine(damRaw, trait.key, multiplier)
    const avgVal = normalizeForEngine(breedAvg, trait.key, multiplier)

    let progeny: number | null
    if (sireVal != null && damVal != null) {
      progeny = (sireVal + damVal) / 2
    } else if (sireVal != null && avgVal != null) {
      progeny = (sireVal + avgVal) / 2
    } else if (damVal != null && avgVal != null) {
      progeny = (damVal + avgVal) / 2
    } else {
      progeny = null
    }

    predictedProgeny[trait.key] = progeny

    if (progeny != null) {
      const range = breedConfig.percentileRanges[trait.key]
      if (range) {
        percentileRankings[trait.key] = estimatePercentile(
          progeny,
          range,
          trait.higherIsBetter
        )
      }
    }
  }

  const indexValues: Record<string, number> = {}
  // Rough placeholder index calculation: if sire+dam both have it, parent-average.
  for (const idx of breedConfig.indexes) {
    const s = sire.epds[idx.key]
    const d = dam.epds[idx.key]
    if (typeof s === 'number' && typeof d === 'number') {
      indexValues[idx.key] = (s + d) / 2
    }
  }

  let weightedScore: number | undefined
  if (options.customWeights) {
    weightedScore = weightedIndexScore(
      { predictedProgeny, percentileRankings } as MatingPrediction,
      options.customWeights
    )
  }

  const wagyuContent = predictCrossbredWagyuContent(sire, dam)

  return {
    sire,
    dam,
    breedConfig,
    predictedProgeny,
    percentileRankings,
    indexValues,
    weightedScore,
    customWeights: options.customWeights,
    predictedWagyuContent: wagyuContent.pct,
    wagyuContentLabel: wagyuContent.label,
    createdAt: new Date().toISOString()
  }
}

function normalizeForEngine(
  value: number | null | undefined,
  traitKey: string,
  marblingScaleMultiplier?: number
): number | null {
  if (value == null) return null
  if (marblingScaleMultiplier && traitKey.toLowerCase().startsWith('marb')) {
    return value / marblingScaleMultiplier
  }
  return value
}

// ----------------------------------------------------------------------------
// 2. estimatePercentile — linear interpolation over p10..p90.
// ----------------------------------------------------------------------------

export function estimatePercentile(
  value: number,
  range: PercentileRange,
  higherIsBetter: boolean
): number {
  const breakpoints: Array<[number, number]> = higherIsBetter
    ? [
        [range.p10, 10],
        [range.p25, 25],
        [range.p50, 50],
        [range.p75, 75],
        [range.p90, 90]
      ]
    : [
        [range.p10, 10],
        [range.p25, 25],
        [range.p50, 50],
        [range.p75, 75],
        [range.p90, 90]
      ]

  const sorted = higherIsBetter
    ? [...breakpoints].sort((a, b) => a[0] - b[0])
    : [...breakpoints].sort((a, b) => b[0] - a[0])

  // Below p10
  if (
    (higherIsBetter && value <= sorted[0][0]) ||
    (!higherIsBetter && value >= sorted[0][0])
  ) {
    return Math.max(2, sorted[0][1] - 5)
  }
  // Above p90
  const last = sorted[sorted.length - 1]
  if (
    (higherIsBetter && value >= last[0]) ||
    (!higherIsBetter && value <= last[0])
  ) {
    return Math.min(98, last[1] + 5)
  }

  // Linear interpolation within segment
  for (let i = 0; i < sorted.length - 1; i++) {
    const [v1, p1] = sorted[i]
    const [v2, p2] = sorted[i + 1]
    const between = higherIsBetter
      ? value >= v1 && value <= v2
      : value <= v1 && value >= v2
    if (between) {
      const t = v2 === v1 ? 0 : (value - v1) / (v2 - v1)
      const pct = p1 + t * (p2 - p1)
      return clamp(Math.round(pct), 2, 98)
    }
  }
  return 50
}

// ----------------------------------------------------------------------------
// 3. rankMatings
// ----------------------------------------------------------------------------

export function rankMatings(
  predictions: MatingPrediction[],
  priorityTrait: string,
  higherIsBetter: boolean
): MatingPrediction[] {
  return [...predictions].sort((a, b) => {
    const av = a.predictedProgeny[priorityTrait]
    const bv = b.predictedProgeny[priorityTrait]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    return higherIsBetter ? bv - av : av - bv
  })
}

// ----------------------------------------------------------------------------
// 4. weightedIndexScore
// ----------------------------------------------------------------------------

export function weightedIndexScore(
  prediction: Pick<MatingPrediction, 'predictedProgeny' | 'percentileRankings'>,
  weights: Record<string, number>
): number {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return 0

  let sum = 0
  for (const [key, w] of Object.entries(weights)) {
    const pct = prediction.percentileRankings[key]
    if (typeof pct === 'number') {
      sum += pct * w
    }
  }
  return +(sum / totalWeight).toFixed(2)
}

// ----------------------------------------------------------------------------
// 5. compareToPublicPopulation
// ----------------------------------------------------------------------------

export function compareToPublicPopulation(
  animal: Animal,
  publicRecords: PublicSireRecord[],
  traitKey: string,
  higherIsBetter: boolean
): ComparisonResult | null {
  const animalVal = animal.epds[traitKey]
  if (animalVal == null) return null

  const values = publicRecords
    .map((r) => r.epds[traitKey])
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => (higherIsBetter ? b - a : a - b))
  let rank = sorted.findIndex((v) =>
    higherIsBetter ? animalVal >= v : animalVal <= v
  )
  if (rank === -1) rank = sorted.length

  const percentile = clamp(
    Math.round(((sorted.length - rank) / sorted.length) * 100),
    1,
    99
  )
  const top10Index = Math.max(0, Math.floor(sorted.length * 0.1) - 1)
  const top10Threshold = sorted[top10Index]
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length

  return {
    rank: rank + 1,
    totalInPopulation: sorted.length,
    percentile,
    top10Threshold,
    breedAverageAmongPublic: +avg.toFixed(3)
  }
}

// ----------------------------------------------------------------------------
// 6. checkEvaluationSystemCompatibility
// ----------------------------------------------------------------------------

export function checkEvaluationSystemCompatibility(
  breedA: BreedConfig,
  breedB: BreedConfig
): boolean {
  return breedA.evaluationSystem === breedB.evaluationSystem
}

// ----------------------------------------------------------------------------
// Wagyu content prediction (Step 18)
// ----------------------------------------------------------------------------

export function predictCrossbredWagyuContent(
  sire: Animal,
  dam: Animal
): { pct: number; label: WagyuContentLabel } {
  const s = wagyuContentOf(sire)
  const d = wagyuContentOf(dam)

  if (s.kind === 'none' && d.kind === 'none') {
    return { pct: 0, label: 'N/A' }
  }

  // Japanese Black x Japanese Red cross (both 100% Wagyu but different breeds)
  if (
    (s.kind === 'black_full' && d.kind === 'red_full') ||
    (s.kind === 'red_full' && d.kind === 'black_full')
  ) {
    return { pct: 100, label: 'Cross (not Fullblood)' }
  }

  const pct = (s.pct + d.pct) / 2
  return { pct: +pct.toFixed(2), label: labelForPct(pct, s, d) }
}

type WagyuContent =
  | { kind: 'black_full'; pct: 100 }
  | { kind: 'red_full'; pct: 100 }
  | { kind: 'au_full'; pct: 100 }
  | { kind: 'black_pure'; pct: 93.75 }
  | { kind: 'f3'; pct: 87.5 }
  | { kind: 'f2'; pct: 75 }
  | { kind: 'f1'; pct: 50 }
  | { kind: 'none'; pct: 0 }

function wagyuContentOf(a: Animal): WagyuContent {
  const s = a.wagyuSubtype
  if (!s) return { kind: 'none', pct: 0 }
  const map: Record<WagyuSubtype, WagyuContent> = {
    wagyu_black_fullblood_awa: { kind: 'black_full', pct: 100 },
    wagyu_au_fullblood: { kind: 'au_full', pct: 100 },
    wagyu_red_akaushi_fullblood: { kind: 'red_full', pct: 100 },
    wagyu_red_akaushi_purebred: { kind: 'black_pure', pct: 93.75 },
    wagyu_black_purebred_awa: { kind: 'black_pure', pct: 93.75 },
    wagyu_au_purebred: { kind: 'black_pure', pct: 93.75 },
    wagyu_black_f3: { kind: 'f3', pct: 87.5 },
    wagyu_black_f2: { kind: 'f2', pct: 75 },
    wagyu_black_f1: { kind: 'f1', pct: 50 },
    wagyu_au_f1: { kind: 'f1', pct: 50 }
  }
  return map[s]
}

function labelForPct(
  pct: number,
  s: WagyuContent,
  d: WagyuContent
): WagyuContentLabel {
  if (s.kind === 'black_full' && d.kind === 'black_full') return 'Fullblood'
  if (s.kind === 'au_full' && d.kind === 'au_full') return 'Fullblood'
  if (s.kind === 'red_full' && d.kind === 'red_full') return 'Fullblood'
  if (pct >= 93.75) return 'Purebred'
  if (pct >= 87.5) return 'F3'
  if (pct >= 75) return 'F2'
  if (pct >= 50) return 'F1'
  if (pct > 0) return 'F1'
  return 'N/A'
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
