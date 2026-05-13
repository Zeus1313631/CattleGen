/**
 * CattleGen — shared TypeScript types.
 *
 * Important context:
 *  - "Wagyu" is not a single breed; it is an umbrella term for several distinct
 *    Japanese breeds (Japanese Black / Kuroge Washu, Japanese Red / Akage Washu /
 *    Akaushi, and several minor lines). Each has its own association, evaluation
 *    system, and config file in /src/breeds.
 *  - US associations publish EPDs. AWA-AU publishes WBVs (replaced legacy
 *    BREEDPLAN EBVs in Feb 2026). These values are NOT directly comparable.
 */

export type WagyuSubtype =
  | 'wagyu_black_fullblood_awa' // American Wagyu Association — Japanese Black Fullblood (100% verified)
  | 'wagyu_black_purebred_awa'  // American Wagyu Association — Purebred (93.75%+)
  | 'wagyu_black_f1'            // F1 cross (50% Wagyu, typically x Angus)
  | 'wagyu_black_f2'            // F2 cross (75% Wagyu)
  | 'wagyu_black_f3'            // F3 cross (87.5% Wagyu)
  | 'wagyu_red_akaushi_fullblood' // Japanese Red / Akaushi — Fullblood (American Akaushi Association)
  | 'wagyu_red_akaushi_purebred'  // Akaushi Purebred
  | 'wagyu_au_fullblood'          // Australian Wagyu Association — Fullblood (WBV system)
  | 'wagyu_au_purebred'           // Australian Wagyu Association — Purebred
  | 'wagyu_au_f1'                 // Australian F1 (AWA-AU registered)

export type EvaluationSystem = 'EPD' | 'EBV' | 'WBV' | 'MBV'
// EPD = Expected Progeny Difference (US standard, AWA-American and all US associations)
// EBV = Estimated Breeding Value (Australia BREEDPLAN legacy, retired by AWA-AU Feb 2026)
// WBV = Wagyu Breeding Value (Australian Wagyu Association new system from Feb 2026)
// MBV = Molecular Breeding Value (used in AWA Feeder Check and genomic-only animals)

export type TraitCategory =
  | 'growth'
  | 'maternal'
  | 'carcass'
  | 'calving'
  | 'efficiency'
  | 'index'
  | 'genomic'
  | 'prefectural'

export interface EPDTrait {
  key: string
  label: string
  unit: string
  higherIsBetter: boolean
  category: TraitCategory
  description: string
  evaluationSystem: EvaluationSystem
  isWagyuSpecific?: boolean
  isBreedUnique?: boolean
}

export interface PercentileRange {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface IndexDef {
  key: string
  label: string
  description: string
  unit: string
}

export interface PrefecturalTraitDef {
  key: string
  label: string
  description: string
}

export interface BreedConfig {
  id: string
  name: string
  association: string
  evaluationSystem: EvaluationSystem
  wagyuSubtype?: WagyuSubtype
  /** true for AWA-AU — tracks % Tajima, Kedaka, Tottori, Shimane, Itozakura, Okayama, Hiroshima */
  prefecturalTracking?: boolean
  /** e.g. Wagyu: ["F11","IARS","B3","CHS","CL16","F13"] */
  geneticConditions?: string[]
  /** Brahman: 100 (their marbling EPD scale is 100x other breeds). */
  marblingScaleMultiplier?: number
  traits: EPDTrait[]
  breedAverages: Record<string, number>
  percentileRanges: Record<string, PercentileRange>
  indexes: IndexDef[]
  prefecturalTraits?: PrefecturalTraitDef[]
  /** Beefmaster "Six Essentials" — displayed as a breed context card. */
  sixEssentials?: string[]
  dataSourceUrl?: string
  notes?: string
}

export interface PrefecturalComposition {
  /** Australian Wagyu prefectural system — percentage of each Japanese prefecture bloodline. */
  tajima?: number     // Hyogo (Kobe beef origin) — most prized for marbling
  kedaka?: number     // Tottori — strong growth
  shimane?: number
  itozakura?: number  // Shimane variant
  tottori?: number
  okayama?: number
  hiroshima?: number
}

export type GeneticConditionStatus = 'Free' | 'Carrier' | 'Affected' | 'Unknown'

export interface GenomicProfile {
  testDate?: string
  testingLab?: string
  reportFile?: string // path to uploaded PDF/CSV
  snpPanelSize?: number // e.g. 50000, 100000, 150000
  parentageVerified?: boolean
  breedComposition?: Record<string, number> // % of each breed
  geneticConditions?: Record<string, Exclude<GeneticConditionStatus, 'Unknown'>>
  genomicEPDs?: Record<string, number> // GE-EPDs if provided by lab
  rawMarkers?: Record<string, string>
}

export type AnimalSex = 'bull' | 'cow' | 'heifer' | 'steer'

export interface Animal {
  id?: number
  registrationNumber?: string
  name: string
  tattoo?: string
  breedId: string
  wagyuSubtype?: WagyuSubtype
  sex: AnimalSex
  birthYear?: number
  birthDate?: string
  sireId?: number
  damId?: number
  epds: Record<string, number | null>
  accuracy?: Record<string, number>
  genomicData?: GenomicProfile
  prefecturalComposition?: PrefecturalComposition
  geneticConditionStatus?: Record<string, GeneticConditionStatus>
  /** true if pulled from a public sire summary snapshot. */
  isPublicRecord?: boolean
  sourceAssociation?: string
  herdId?: number
  notes?: string
  photoUrl?: string
}

export interface Herd {
  id?: number
  name: string
  breedId: string
  ranchId?: number
  notes?: string
}

export interface Ranch {
  id?: number
  name: string
  ownerName?: string
  location?: string
  notes?: string
  /** the primary "My Ranch" profile */
  isMyRanch?: boolean
}

export interface MatingPrediction {
  id?: number
  sire: Animal
  dam: Animal
  breedConfig: BreedConfig
  predictedProgeny: Record<string, number | null>
  percentileRankings: Record<string, number>
  indexValues?: Record<string, number>
  weightedScore?: number
  customWeights?: Record<string, number>
  predictedWagyuContent?: number
  wagyuContentLabel?: WagyuContentLabel
  /** True when sire and dam are from different EPD breeds and USMARC 2024 AB-EPD adjustments were applied. */
  isAbEpdAdjusted?: boolean
  notes?: string
  createdAt?: string
}

export type WagyuContentLabel =
  | 'Fullblood'
  | 'Purebred'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'Cross (not Fullblood)'
  | 'N/A'

export type PublicDataSource =
  | 'AWA'
  | 'AWA-AU'
  | 'AAA'
  | 'AHA'
  | 'ASA'
  | 'NALF'
  | 'ABBA'
  | 'RAAA'
  | 'Akaushi'
  | 'BBU'

export interface PublicSireRecord {
  registrationNumber: string
  name: string
  breedId: string
  wagyuSubtype?: WagyuSubtype
  association: string
  epds: Record<string, number | null>
  accuracy?: Record<string, number>
  prefecturalComposition?: PrefecturalComposition
  sireOfSire?: string
  damOfSire?: string
  birthYear?: number
  lastUpdated?: string
  dataSource: PublicDataSource
}

export interface PublicSireSummaryFile {
  association: string
  evaluationSystem: EvaluationSystem
  lastUpdated: string
  records: PublicSireRecord[]
}

export interface GenomicImportResult {
  success: boolean
  animalsFound: number
  traitsExtracted: string[]
  errors?: string[]
  parsedData?: Partial<GenomicProfile>
  detectedLab?: string
  registrationNumber?: string
  name?: string
}

export interface ComparisonResult {
  rank: number
  totalInPopulation: number
  percentile: number
  top10Threshold: number
  breedAverageAmongPublic: number
}
