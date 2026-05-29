interface Props {
  percentile: number
  showLabel?: boolean
}

/**
 * Colour coding:
 *  - Top 10% (pct >= 90): gold
 *  - Top 25% (pct >= 75): green
 *  - Middle 25-75: grey
 *  - Bottom 25% (pct < 25): red
 *
 * NOTE: percentile here is "higher = better" regardless of trait direction;
 *       the engine already flipped direction per trait.higherIsBetter.
 */
export default function PercentileBadge({ percentile, showLabel = true }: Props) {
  const cls =
    percentile >= 90
      ? 'badge-gold'
      : percentile >= 75
        ? 'badge-green'
        : percentile >= 25
          ? 'badge-grey'
          : 'badge-red'

  return (
    <span className={`${cls} tabular-nums`}>
      {showLabel ? `Top ${Math.max(1, 100 - percentile)}%` : `${percentile}%`}
    </span>
  )
}
