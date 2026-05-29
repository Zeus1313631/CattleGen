/**
 * Genomic report importer.
 *
 * Supports common lab formats:
 *  1. Neogen GGP (CSV) — Wagyu, Angus, many US breeds. SNP + breed composition.
 *  2. Zoetis Clarifide (CSV/PDF text) — Angus GE-EPDs, genetic conditions.
 *  3. Igenity (CSV) — trait scores + breed composition.
 *  4. GeneSeek (CSV) — raw SNP or processed trait scores.
 *  5. Generic CSV — user-defined column mapping.
 */

import type {
  GenomicImportResult,
  GenomicProfile,
  GeneticConditionStatus
} from '../types'

export type LabFormat =
  | 'neogen'
  | 'zoetis'
  | 'igenity'
  | 'geneseek'
  | 'generic'
  | 'unknown'

export interface ImportOptions {
  format?: LabFormat
  columnMap?: Record<string, string>
  defaultPanelSize?: number
}

export function parseGenomicReport(
  contents: string,
  fileName: string,
  opts: ImportOptions = {}
): GenomicImportResult {
  const format = opts.format ?? detectLabFormat(contents, fileName)
  try {
    switch (format) {
      case 'neogen':
        return parseNeogen(contents)
      case 'zoetis':
        return parseZoetis(contents)
      case 'igenity':
        return parseIgenity(contents)
      case 'geneseek':
        return parseGeneSeek(contents)
      default:
        return parseGenericCsv(contents, opts.columnMap)
    }
  } catch (err) {
    return {
      success: false,
      animalsFound: 0,
      traitsExtracted: [],
      errors: [err instanceof Error ? err.message : String(err)],
      detectedLab: format
    }
  }
}

export function detectLabFormat(contents: string, fileName: string): LabFormat {
  const lower = (contents.slice(0, 2048) + fileName).toLowerCase()
  if (lower.includes('neogen') || lower.includes('ggp')) return 'neogen'
  if (lower.includes('clarifide') || lower.includes('zoetis')) return 'zoetis'
  if (lower.includes('igenity')) return 'igenity'
  if (lower.includes('geneseek')) return 'geneseek'
  return 'unknown'
}

// ----------------------------------------------------------------------------
// CSV helpers
// ----------------------------------------------------------------------------

interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

function parseCsv(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = splitCsvLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    rows.push(row)
  }
  return { headers, rows }
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      out.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current.trim())
  return out
}

function normalizeConditionStatus(raw: string): GeneticConditionStatus | null {
  const s = raw.trim().toUpperCase()
  if (!s) return null
  if (s === 'TM' || s === 'FREE' || s === 'F' || s === 'NEGATIVE') return 'Free'
  if (s === 'TM*C' || s === 'CARRIER' || s === 'C' || s === 'HET') return 'Carrier'
  if (s === 'A' || s === 'AFFECTED' || s === 'HOM AFFECTED' || s === 'POSITIVE')
    return 'Affected'
  return 'Unknown'
}

// ----------------------------------------------------------------------------
// Neogen GGP
// ----------------------------------------------------------------------------

function parseNeogen(text: string): GenomicImportResult {
  const csv = parseCsv(text)
  if (csv.rows.length === 0) {
    return { success: false, animalsFound: 0, traitsExtracted: [], errors: ['Empty CSV'], detectedLab: 'neogen' }
  }
  const row = csv.rows[0]

  const profile: Partial<GenomicProfile> = {
    testingLab: 'Neogen GeneSeek',
    snpPanelSize: guessPanelSize(csv.headers.join(' ') + ' ' + text.slice(0, 2000)),
    breedComposition: {},
    geneticConditions: {}
  }

  for (const [k, v] of Object.entries(row)) {
    const key = k.toLowerCase()
    if (key.includes('wagyu%') || key.includes('wagyu_pct') || key.includes('% wagyu')) {
      profile.breedComposition!['wagyu'] = parseFloat(v) || 0
    } else if (key.includes('angus%') || key.includes('% angus')) {
      profile.breedComposition!['angus'] = parseFloat(v) || 0
    } else if (
      ['f11', 'iars', 'b3', 'chs', 'cl16', 'f13'].some((c) => key === c || key.endsWith('_' + c) || key.includes(c + '_status'))
    ) {
      const code = ['f11', 'iars', 'b3', 'chs', 'cl16', 'f13'].find((c) => key.includes(c))
      if (code) {
        const status = normalizeConditionStatus(v)
        if (status && status !== 'Unknown') {
          profile.geneticConditions![code.toUpperCase()] = status as Exclude<
            GeneticConditionStatus,
            'Unknown'
          >
        }
      }
    } else if (key === 'parentage' || key.includes('parentage_verified')) {
      profile.parentageVerified = /^(yes|true|verified|pass)/i.test(v)
    }
  }

  return {
    success: true,
    animalsFound: csv.rows.length,
    traitsExtracted: Object.keys(profile.breedComposition ?? {})
      .concat(Object.keys(profile.geneticConditions ?? {})),
    parsedData: profile,
    detectedLab: 'neogen',
    registrationNumber: row['RegistrationNumber'] ?? row['Reg Number'] ?? undefined,
    name: row['Name'] ?? row['AnimalName'] ?? undefined
  }
}

// ----------------------------------------------------------------------------
// Zoetis Clarifide
// ----------------------------------------------------------------------------

function parseZoetis(text: string): GenomicImportResult {
  const csv = parseCsv(text)
  if (csv.rows.length === 0) {
    // Maybe it's a PDF-to-text dump — fall back to simple regex extraction.
    return extractZoetisFromText(text)
  }
  const row = csv.rows[0]
  const profile: Partial<GenomicProfile> = {
    testingLab: 'Zoetis Clarifide',
    snpPanelSize: guessPanelSize(text.slice(0, 2000)),
    genomicEPDs: {},
    geneticConditions: {}
  }

  for (const [k, v] of Object.entries(row)) {
    const key = k.toLowerCase()
    if (/^(ced|bw|ww|yw|milk|marb|re|fat|cw|\$w|\$b|\$c|\$g|\$f|\$m)$/i.test(k)) {
      const num = parseFloat(v)
      if (!Number.isNaN(num)) profile.genomicEPDs![k] = num
    } else if (['am', 'nh', 'ca', 'dd', 'oh'].some((c) => key === c)) {
      const status = normalizeConditionStatus(v)
      if (status && status !== 'Unknown') {
        profile.geneticConditions![k.toUpperCase()] = status as Exclude<
          GeneticConditionStatus,
          'Unknown'
        >
      }
    }
  }

  return {
    success: true,
    animalsFound: csv.rows.length,
    traitsExtracted: Object.keys(profile.genomicEPDs ?? {}),
    parsedData: profile,
    detectedLab: 'zoetis',
    registrationNumber: row['Reg#'] ?? row['RegNumber'] ?? undefined,
    name: row['Name'] ?? undefined
  }
}

function extractZoetisFromText(text: string): GenomicImportResult {
  const profile: Partial<GenomicProfile> = {
    testingLab: 'Zoetis Clarifide (PDF)',
    genomicEPDs: {},
    geneticConditions: {}
  }
  const traits = ['CED', 'BW', 'WW', 'YW', 'Milk', 'Marb', 'RE', 'Fat', 'CW']
  for (const t of traits) {
    const re = new RegExp(`\\b${t}\\b[^\\d\\-]*(-?\\d+(?:\\.\\d+)?)`, 'i')
    const m = text.match(re)
    if (m) profile.genomicEPDs![t] = parseFloat(m[1])
  }
  return {
    success: Object.keys(profile.genomicEPDs!).length > 0,
    animalsFound: 1,
    traitsExtracted: Object.keys(profile.genomicEPDs ?? {}),
    parsedData: profile,
    detectedLab: 'zoetis'
  }
}

// ----------------------------------------------------------------------------
// Igenity
// ----------------------------------------------------------------------------

function parseIgenity(text: string): GenomicImportResult {
  const csv = parseCsv(text)
  const row = csv.rows[0] ?? {}
  const profile: Partial<GenomicProfile> = {
    testingLab: 'Neogen Igenity',
    snpPanelSize: guessPanelSize(text.slice(0, 2000)),
    breedComposition: {},
    genomicEPDs: {}
  }
  for (const [k, v] of Object.entries(row)) {
    const num = parseFloat(v)
    if (!Number.isNaN(num)) {
      if (/%|pct|composition/i.test(k)) {
        const label = k.replace(/[_\s]*(%|pct|composition).*/i, '').toLowerCase().trim()
        if (label) profile.breedComposition![label] = num
      } else {
        profile.genomicEPDs![k] = num
      }
    }
  }
  return {
    success: csv.rows.length > 0,
    animalsFound: csv.rows.length,
    traitsExtracted: Object.keys(profile.genomicEPDs!).concat(Object.keys(profile.breedComposition!)),
    parsedData: profile,
    detectedLab: 'igenity'
  }
}

// ----------------------------------------------------------------------------
// GeneSeek
// ----------------------------------------------------------------------------

function parseGeneSeek(text: string): GenomicImportResult {
  const csv = parseCsv(text)
  return {
    success: csv.rows.length > 0,
    animalsFound: csv.rows.length,
    traitsExtracted: csv.headers,
    parsedData: {
      testingLab: 'GeneSeek',
      snpPanelSize: guessPanelSize(text.slice(0, 2000))
    },
    detectedLab: 'geneseek'
  }
}

// ----------------------------------------------------------------------------
// Generic CSV
// ----------------------------------------------------------------------------

function parseGenericCsv(
  text: string,
  columnMap?: Record<string, string>
): GenomicImportResult {
  const csv = parseCsv(text)
  if (csv.rows.length === 0) {
    return {
      success: false,
      animalsFound: 0,
      traitsExtracted: [],
      errors: ['No rows found — user mapping required.'],
      detectedLab: 'unknown'
    }
  }

  const profile: Partial<GenomicProfile> = {
    testingLab: 'Generic',
    genomicEPDs: {},
    breedComposition: {}
  }

  const row = csv.rows[0]
  for (const [csvHeader, appField] of Object.entries(columnMap ?? {})) {
    const v = row[csvHeader]
    const num = parseFloat(v)
    if (!Number.isNaN(num)) {
      profile.genomicEPDs![appField] = num
    }
  }

  return {
    success: true,
    animalsFound: csv.rows.length,
    traitsExtracted: Object.keys(profile.genomicEPDs ?? {}),
    parsedData: profile,
    detectedLab: 'generic'
  }
}

function guessPanelSize(sample: string): number | undefined {
  const s = sample.toUpperCase()
  if (s.includes('150K') || s.includes('150,000')) return 150000
  if (s.includes('100K')) return 100000
  if (s.includes('HD') && s.includes('777')) return 777000
  if (s.includes('50K') || s.includes('50,000')) return 50000
  return undefined
}
