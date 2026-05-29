import type { PublicSireSummaryFile } from '../types'

import awa from './awa_sire_summary.json'
import awaAu from './awa_au_sire_summary.json'
import aaa from './aaa_sire_summary.json'
import aha from './aha_sire_summary.json'
import akaushi from './akaushi_sire_summary.json'
import bbu from './bbu_sire_summary.json'

export const PUBLIC_SIRE_SUMMARIES: PublicSireSummaryFile[] = [
  awa as PublicSireSummaryFile,
  awaAu as PublicSireSummaryFile,
  aaa as PublicSireSummaryFile,
  aha as PublicSireSummaryFile,
  akaushi as PublicSireSummaryFile,
  bbu as PublicSireSummaryFile
]
