import { useState } from 'react'
import type { GeneticConditionStatus } from '../types'

/**
 * Wagyu genetic condition reference.
 * Tooltip explains each condition's effect.
 */
const CONDITION_INFO: Record<string, string> = {
  F11: 'Factor XI Deficiency — autosomal recessive mild coagulation disorder. Carriers are healthy.',
  IARS: 'IARS Disorder — growth failure in affected calves (homozygous). Carriers unaffected.',
  B3: 'Spherocytosis (Band 3 Deficiency) — abnormal red blood cells in affected animals. Carriers unaffected.',
  CHS: 'Chediak-Higashi Syndrome — immune/bleeding disorder in affected animals.',
  CL16: 'Claudin 16 Deficiency — renal tubular dysplasia in affected calves.',
  F13: 'Factor XIII Deficiency — umbilical bleeding and poor wound healing in affected calves.',
  AM: 'Angus — Arthrogryposis Multiplex (Curly Calf). Affected calves non-viable.',
  NH: 'Angus — Neuropathic Hydrocephalus (Water Head). Affected calves non-viable.',
  CA: 'Angus — Contractural Arachnodactyly (Fawn Calf Syndrome).',
  DD: 'Angus — Developmental Duplication (polymelia).',
  OH: 'Angus — Oculocutaneous Hypopigmentation.',
  MH: 'Angus — Mannosidosis (rare).',
  IE: 'Hereford — Idiopathic Epilepsy.',
  HY: 'Hereford — Hypotrichosis.',
  DL: 'Hereford — Dilutor gene (color modifier).',
  MSUD: 'Hereford — Maple Syrup Urine Disease.'
}

export default function GeneticConditionBadge({
  code,
  status
}: {
  code: string
  status: GeneticConditionStatus
}) {
  const [showTip, setShowTip] = useState(false)

  const classes =
    status === 'Free'
      ? 'badge-green'
      : status === 'Carrier'
        ? 'badge-yellow'
        : status === 'Affected'
          ? 'badge-red'
          : 'badge-grey'

  const statusLabel =
    status === 'Free'
      ? 'TM — Free'
      : status === 'Carrier'
        ? 'TM*C — Carrier'
        : status === 'Affected'
          ? 'Affected'
          : 'Unknown'

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className={`${classes} cursor-help font-mono`}
      >
        {code}: {statusLabel}
      </button>
      {showTip && (
        <span className="absolute z-20 left-0 top-full mt-1 w-64 rounded-md bg-ranch-900 text-ranch-100 text-xs p-2 shadow-lg">
          <strong className="block text-white">{code}</strong>
          {CONDITION_INFO[code] ?? 'Genetic condition — see association documentation for details.'}
        </span>
      )}
    </span>
  )
}
