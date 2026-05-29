import type { WagyuContentLabel } from '../types'

interface Props {
  pct: number
  label: WagyuContentLabel
  size?: 'sm' | 'md' | 'lg'
}

export default function WagyuContentBadge({ pct, label, size = 'md' }: Props) {
  if (label === 'N/A') return null

  const isCross = label === 'Cross (not Fullblood)'
  const tone = isCross
    ? 'bg-amber-100 border-amber-300 text-amber-900'
    : label === 'Fullblood'
      ? 'bg-wagyu-100 border-wagyu-300 text-wagyu-900'
      : 'bg-ranch-100 border-ranch-300 text-ranch-900'

  const padding =
    size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm'

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border ${tone} ${padding}`}>
      <span className="font-semibold">{label}</span>
      <span className="tabular-nums opacity-80">{pct.toFixed(2)}% Wagyu</span>
      {isCross && (
        <span className="text-xs font-medium italic">
          (Japanese Black × Japanese Red)
        </span>
      )}
    </div>
  )
}
