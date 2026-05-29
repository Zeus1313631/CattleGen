import { useEffect, useMemo, useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'
import { GitMerge, Play, Save, Plus, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PercentileBadge from '../components/PercentileBadge'
import WagyuContentBadge from '../components/WagyuContentBadge'
import EvaluationSystemWarning from '../components/EvaluationSystemWarning'
import { getBreedConfig, getBreedConfigs } from '../breeds'
import { PUBLIC_SIRE_SUMMARIES } from '../publicData'
import {
  CrossEvaluationSystemError,
  estimatePercentile,
  predictProgeny,
  weightedIndexScore
} from '../engine/predictionEngine'
import { listAnimals, saveMating } from '../db/queries'
import type {
  Animal,
  BreedConfig,
  MatingPrediction,
  PublicSireRecord
} from '../types'

const PREFECTURAL_COLORS = [
  '#a82828',
  '#8c683a',
  '#d3bc8f',
  '#be9c63',
  '#4a3826',
  '#be6464',
  '#ea9898'
]

export default function PredictionsPage() {
  const [myAnimals, setMyAnimals] = useState<Animal[]>([])
  const [publicRecords] = useState<PublicSireRecord[]>(() =>
    PUBLIC_SIRE_SUMMARIES.flatMap((f) => f.records)
  )

  useEffect(() => {
    void listAnimals({ publicOnly: false }).then(setMyAnimals)
  }, [])

  const [sire, setSire] = useState<Animal | null>(null)
  const [dam, setDam] = useState<Animal | null>(null)
  const [prediction, setPrediction] = useState<MatingPrediction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [incompatible, setIncompatible] = useState<null | {
    breedA: BreedConfig
    breedB: BreedConfig
  }>(null)

  const [batchSires, setBatchSires] = useState<Animal[]>([])
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({})
  const [priorityTrait, setPriorityTrait] = useState<string>('Marb')

  function runPrediction(selectedSire: Animal | null, selectedDam: Animal | null) {
    setError(null)
    setIncompatible(null)
    if (!selectedSire || !selectedDam) {
      setPrediction(null)
      return
    }
    const sBreed = getBreedConfig(selectedSire.breedId)
    const dBreed = getBreedConfig(selectedDam.breedId)
    if (!sBreed || !dBreed) {
      setError('Missing breed config for one of the selected animals.')
      setPrediction(null)
      return
    }
    if (sBreed.evaluationSystem !== dBreed.evaluationSystem) {
      setIncompatible({ breedA: sBreed, breedB: dBreed })
      setPrediction(null)
      return
    }
    try {
      const result = predictProgeny(selectedSire, selectedDam, sBreed, {
        customWeights: Object.keys(customWeights).length > 0 ? customWeights : undefined
      })
      setPrediction(result)
    } catch (e) {
      if (e instanceof CrossEvaluationSystemError) {
        setIncompatible({ breedA: sBreed, breedB: dBreed })
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
      setPrediction(null)
    }
  }

  const breedConfig = prediction?.breedConfig ?? null

  return (
    <div>
      <PageHeader
        title="Breeding Predictions"
        subtitle="Parent-average progeny prediction with percentile ranks, index values, and Wagyu content classification."
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <AnimalPanel
            title="Sire"
            kind="bull"
            animal={sire}
            myAnimals={myAnimals.filter((a) => a.sex === 'bull' || a.sex === 'steer')}
            publicRecords={publicRecords}
            onChange={(a) => {
              setSire(a)
              runPrediction(a, dam)
            }}
          />
          <AnimalPanel
            title="Dam"
            kind="cow"
            animal={dam}
            myAnimals={myAnimals.filter((a) => a.sex === 'cow' || a.sex === 'heifer')}
            publicRecords={publicRecords}
            onChange={(a) => {
              setDam(a)
              runPrediction(sire, a)
            }}
          />
        </div>

        {sire && dam && !prediction && !incompatible && (
          <div className="flex justify-center">
            <button
              className="btn-primary"
              onClick={() => runPrediction(sire, dam)}
            >
              <Play size={14} /> Predict
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-wagyu-50 border border-wagyu-200 p-3 text-sm text-wagyu-900">
            {error}
          </div>
        )}

        {incompatible && sire && dam && (
          <EvaluationSystemWarning
            animalA={sire}
            animalB={dam}
            breedA={incompatible.breedA}
            breedB={incompatible.breedB}
          />
        )}

        {prediction && breedConfig && (
          <PredictionResult
            prediction={prediction}
            breed={breedConfig}
            onSave={async () => {
              await saveMating(prediction)
              alert('Prediction saved to history.')
            }}
          />
        )}

        <BatchComparison
          dam={dam}
          sires={batchSires}
          myAnimals={myAnimals.filter((a) => a.sex === 'bull' || a.sex === 'steer')}
          publicRecords={publicRecords}
          priorityTrait={priorityTrait}
          customWeights={customWeights}
          onAddSire={(s) => setBatchSires((v) => [...v, s])}
          onRemoveSire={(i) => setBatchSires((v) => v.filter((_, j) => j !== i))}
          onPriorityChange={setPriorityTrait}
          onWeightsChange={setCustomWeights}
          activeBreed={breedConfig}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function AnimalPanel({
  title,
  kind,
  animal,
  myAnimals,
  publicRecords,
  onChange
}: {
  title: string
  kind: 'bull' | 'cow'
  animal: Animal | null
  myAnimals: Animal[]
  publicRecords: PublicSireRecord[]
  onChange: (a: Animal | null) => void
}) {
  const [source, setSource] = useState<'myranch' | 'public'>('myranch')
  const breed = animal ? getBreedConfig(animal.breedId) : null

  return (
    <section className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <GitMerge size={16} className="text-ranch-700" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-1 bg-ranch-100 rounded-md p-0.5">
          {(['myranch', 'public'] as const).map((k) => (
            <button
              key={k}
              className={`px-2 py-1 text-xs rounded-md ${
                source === k
                  ? 'bg-white text-ranch-900 shadow-sm'
                  : 'text-ranch-600'
              }`}
              onClick={() => setSource(k)}
            >
              {k === 'myranch' ? 'My Ranch' : 'Public DB'}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <select
          className="input"
          value={animal?.id != null ? `my-${animal.id}` : animal?.registrationNumber ? `pub-${animal.registrationNumber}` : ''}
          onChange={(e) => {
            const val = e.target.value
            if (!val) return onChange(null)
            if (val.startsWith('my-')) {
              const id = Number(val.slice(3))
              onChange(myAnimals.find((a) => a.id === id) ?? null)
            } else if (val.startsWith('pub-')) {
              const reg = val.slice(4)
              const r = publicRecords.find((p) => p.registrationNumber === reg)
              if (r) {
                onChange({
                  name: r.name,
                  registrationNumber: r.registrationNumber,
                  breedId: r.breedId,
                  wagyuSubtype: r.wagyuSubtype,
                  sex: kind,
                  epds: r.epds,
                  prefecturalComposition: r.prefecturalComposition,
                  isPublicRecord: true,
                  sourceAssociation: r.association
                })
              }
            }
          }}
        >
          <option value="">Select {title.toLowerCase()}…</option>
          {source === 'myranch'
            ? myAnimals.map((a) => (
                <option key={`my-${a.id}`} value={`my-${a.id}`}>
                  {a.name} — {getBreedConfig(a.breedId)?.name}
                </option>
              ))
            : publicRecords
                .map((r) => (
                  <option
                    key={`pub-${r.registrationNumber}`}
                    value={`pub-${r.registrationNumber}`}
                  >
                    {r.name} — {r.dataSource}
                  </option>
                ))}
        </select>

        {animal && breed && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-ranch-500">
                  {breed.name} · {breed.evaluationSystem}
                </div>
                <div className="font-semibold">{animal.name}</div>
              </div>
              {animal.registrationNumber && (
                <div className="font-mono text-xs text-ranch-600">
                  {animal.registrationNumber}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {breed.traits.slice(0, 6).map((t) => {
                const v = animal.epds[t.key]
                const range = breed.percentileRanges[t.key]
                return (
                  <div
                    key={t.key}
                    className="rounded-md border border-ranch-200 px-2 py-1"
                  >
                    <div className="text-ranch-500 font-mono">{t.key}</div>
                    <div className="font-semibold tabular-nums">
                      {typeof v === 'number' ? v.toFixed(2) : '—'}
                    </div>
                    {typeof v === 'number' && range && (
                      <div className="mt-0.5">
                        <PercentileBadge
                          percentile={estimatePercentile(v, range, t.higherIsBetter)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function PredictionResult({
  prediction,
  breed,
  onSave
}: {
  prediction: MatingPrediction
  breed: BreedConfig
  onSave: () => void
}) {
  const radarData = breed.traits.slice(0, 8).map((t) => {
    const progeny = prediction.predictedProgeny[t.key]
    const breedAvg = breed.breedAverages[t.key]
    return {
      trait: t.key,
      Progeny: typeof progeny === 'number' ? progeny : 0,
      'Breed Avg': typeof breedAvg === 'number' ? breedAvg : 0
    }
  })

  const isWagyu = breed.id.startsWith('wagyu_')

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="font-semibold">Predicted Progeny</h2>
        <button className="btn-primary" onClick={onSave}>
          <Save size={14} /> Save Prediction
        </button>
      </div>
      <div className="card-body space-y-6">
        {prediction.wagyuContentLabel && prediction.wagyuContentLabel !== 'N/A' && (
          <div className="flex flex-wrap items-center gap-4">
            <WagyuContentBadge
              pct={prediction.predictedWagyuContent ?? 0}
              label={prediction.wagyuContentLabel}
              size="lg"
            />
            {prediction.wagyuContentLabel === 'Cross (not Fullblood)' && (
              <p className="text-sm text-amber-800 max-w-xl">
                Crossing Japanese Black (Kuroge) with Japanese Red (Akaushi)
                produces a crossbred animal — not a Fullblood of either breed.
                The American Wagyu Association and American Akaushi Association
                treat these as separate breeds.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5d8bd" />
                <PolarAngleAxis dataKey="trait" style={{ fontSize: 11 }} />
                <PolarRadiusAxis style={{ fontSize: 10 }} />
                <Radar
                  name="Breed Avg"
                  dataKey="Breed Avg"
                  stroke="#8c683a"
                  fill="#d3bc8f"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Progeny"
                  dataKey="Progeny"
                  stroke="#a82828"
                  fill="#a82828"
                  fillOpacity={0.4}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-2 overflow-y-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Trait</th>
                  <th>Value</th>
                  <th>Rank</th>
                  <th>vs Avg</th>
                </tr>
              </thead>
              <tbody>
                {breed.traits.map((t) => {
                  const v = prediction.predictedProgeny[t.key]
                  const pct = prediction.percentileRankings[t.key]
                  const avg = breed.breedAverages[t.key]
                  const diff =
                    typeof v === 'number' && typeof avg === 'number' ? v - avg : null
                  const isHighlight = isWagyu && /^(Marb|IMF|MS|MFI)$/i.test(t.key)
                  return (
                    <tr
                      key={t.key}
                      className={isHighlight ? 'bg-wagyu-50' : ''}
                    >
                      <td className="font-mono text-xs">{t.key}</td>
                      <td className="tabular-nums">
                        {typeof v === 'number' ? v.toFixed(2) : '—'}
                      </td>
                      <td>
                        {typeof pct === 'number' ? (
                          <PercentileBadge percentile={pct} />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        className={`tabular-nums ${
                          diff == null
                            ? ''
                            : (t.higherIsBetter ? diff >= 0 : diff <= 0)
                              ? 'text-emerald-700'
                              : 'text-wagyu-700'
                        }`}
                      >
                        {diff == null
                          ? '—'
                          : `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {breed.prefecturalTracking &&
          prediction.sire.prefecturalComposition &&
          prediction.dam.prefecturalComposition && (
            <PrefecturalProgenyChart
              sire={prediction.sire.prefecturalComposition}
              dam={prediction.dam.prefecturalComposition}
            />
          )}

        {prediction.indexValues && Object.keys(prediction.indexValues).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
              Index Values
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(prediction.indexValues).map(([k, v]) => {
                const def = breed.indexes.find((i) => i.key === k)
                return (
                  <div
                    key={k}
                    className="rounded-md border border-ranch-200 px-3 py-2"
                  >
                    <div className="text-xs text-ranch-500">{def?.label ?? k}</div>
                    <div className="font-semibold tabular-nums">
                      {v.toFixed(2)} {def?.unit ?? ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {typeof prediction.weightedScore === 'number' && (
          <div className="rounded-lg bg-ranch-100 border border-ranch-200 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-ranch-600">
                Custom Weighted Score
              </div>
              <div className="text-2xl font-bold text-ranch-900 tabular-nums">
                {prediction.weightedScore.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-ranch-600 max-w-md text-right">
              Weighted average of trait percentiles (1-99), normalized by total
              weight. Configure weights under "Batch Comparison" below.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function PrefecturalProgenyChart({
  sire,
  dam
}: {
  sire: NonNullable<Animal['prefecturalComposition']>
  dam: NonNullable<Animal['prefecturalComposition']>
}) {
  const keys = ['tajima', 'kedaka', 'shimane', 'itozakura', 'tottori', 'okayama', 'hiroshima'] as const
  const data = keys
    .map((k) => ({
      name: k[0].toUpperCase() + k.slice(1),
      value: ((sire[k] ?? 0) + (dam[k] ?? 0)) / 2
    }))
    .filter((d) => d.value > 0)

  if (data.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
        Predicted Progeny Prefectural Composition
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => `${entry.name}: ${Number(entry.value).toFixed(1)}%`}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={PREFECTURAL_COLORS[idx % PREFECTURAL_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function BatchComparison({
  dam,
  sires,
  myAnimals,
  publicRecords,
  priorityTrait,
  customWeights,
  onAddSire,
  onRemoveSire,
  onPriorityChange,
  onWeightsChange,
  activeBreed
}: {
  dam: Animal | null
  sires: Animal[]
  myAnimals: Animal[]
  publicRecords: PublicSireRecord[]
  priorityTrait: string
  customWeights: Record<string, number>
  onAddSire: (a: Animal) => void
  onRemoveSire: (i: number) => void
  onPriorityChange: (s: string) => void
  onWeightsChange: (w: Record<string, number>) => void
  activeBreed: BreedConfig | null
}) {
  const breed = activeBreed ?? (dam ? getBreedConfig(dam.breedId) ?? null : null)
  const [source, setSource] = useState<'myranch' | 'public'>('myranch')

  const predictions = useMemo(() => {
    if (!dam || !breed) return []
    return sires
      .map((s) => {
        try {
          const p = predictProgeny(s, dam, breed)
          p.weightedScore = weightedIndexScore(p, customWeights)
          return p
        } catch {
          return null
        }
      })
      .filter((p): p is MatingPrediction => p != null)
      .sort((a, b) => {
        const av = a.predictedProgeny[priorityTrait]
        const bv = b.predictedProgeny[priorityTrait]
        const trait = breed.traits.find((t) => t.key === priorityTrait)
        const higher = trait?.higherIsBetter ?? true
        if (typeof av !== 'number' && typeof bv !== 'number') return 0
        if (typeof av !== 'number') return 1
        if (typeof bv !== 'number') return -1
        return higher ? bv - av : av - bv
      })
  }, [dam, breed, sires, customWeights, priorityTrait])

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="font-semibold">Batch Comparison (up to 5 sires vs one dam)</h2>
      </div>
      <div className="card-body space-y-4">
        {!dam && (
          <p className="text-sm text-ranch-600">
            Select a dam above to enable batch comparison.
          </p>
        )}
        {dam && breed && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-ranch-100 rounded-md p-0.5">
                {(['myranch', 'public'] as const).map((k) => (
                  <button
                    key={k}
                    className={`px-2 py-1 text-xs rounded-md ${
                      source === k ? 'bg-white shadow-sm' : 'text-ranch-600'
                    }`}
                    onClick={() => setSource(k)}
                  >
                    {k === 'myranch' ? 'My Ranch' : 'Public'}
                  </button>
                ))}
              </div>
              <select
                className="input flex-1"
                disabled={sires.length >= 5}
                onChange={(e) => {
                  const val = e.target.value
                  if (!val) return
                  if (val.startsWith('my-')) {
                    const id = Number(val.slice(3))
                    const a = myAnimals.find((x) => x.id === id)
                    if (a) onAddSire(a)
                  } else {
                    const reg = val.slice(4)
                    const r = publicRecords.find((p) => p.registrationNumber === reg)
                    if (r) {
                      onAddSire({
                        name: r.name,
                        registrationNumber: r.registrationNumber,
                        breedId: r.breedId,
                        wagyuSubtype: r.wagyuSubtype,
                        sex: 'bull',
                        epds: r.epds,
                        isPublicRecord: true,
                        sourceAssociation: r.association
                      })
                    }
                  }
                  e.currentTarget.value = ''
                }}
              >
                <option value="">Add sire to compare…</option>
                {source === 'myranch'
                  ? myAnimals
                      .filter((a) => a.breedId === breed.id)
                      .map((a) => (
                        <option key={`my-${a.id}`} value={`my-${a.id}`}>
                          {a.name}
                        </option>
                      ))
                  : publicRecords
                      .filter((r) => r.breedId === breed.id)
                      .map((r) => (
                        <option key={`pub-${r.registrationNumber}`} value={`pub-${r.registrationNumber}`}>
                          {r.name} ({r.dataSource})
                        </option>
                      ))}
              </select>
              <select
                className="input w-40"
                value={priorityTrait}
                onChange={(e) => onPriorityChange(e.target.value)}
              >
                {breed.traits.map((t) => (
                  <option key={t.key} value={t.key}>
                    Rank by {t.key}
                  </option>
                ))}
              </select>
            </div>

            <CustomWeightsEditor
              breed={breed}
              weights={customWeights}
              onChange={onWeightsChange}
            />

            {predictions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sire</th>
                      {breed.traits.slice(0, 6).map((t) => (
                        <th key={t.key}>{t.key}</th>
                      ))}
                      <th>Priority ({priorityTrait})</th>
                      <th>Weighted</th>
                      <th>Wagyu%</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="font-medium">{p.sire.name}</td>
                        {breed.traits.slice(0, 6).map((t) => {
                          const v = p.predictedProgeny[t.key]
                          return (
                            <td key={t.key} className="tabular-nums text-xs">
                              {typeof v === 'number' ? v.toFixed(2) : '—'}
                            </td>
                          )
                        })}
                        <td className="font-semibold tabular-nums">
                          {typeof p.predictedProgeny[priorityTrait] === 'number'
                            ? (p.predictedProgeny[priorityTrait] as number).toFixed(2)
                            : '—'}
                        </td>
                        <td className="tabular-nums">
                          {typeof p.weightedScore === 'number'
                            ? p.weightedScore.toFixed(1)
                            : '—'}
                        </td>
                        <td className="tabular-nums text-xs">
                          {p.wagyuContentLabel && p.wagyuContentLabel !== 'N/A'
                            ? `${p.predictedWagyuContent?.toFixed(1)}% (${p.wagyuContentLabel})`
                            : '—'}
                        </td>
                        <td>
                          <button
                            className="btn-secondary"
                            onClick={() => onRemoveSire(sires.indexOf(p.sire))}
                          >
                            <X size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function CustomWeightsEditor({
  breed,
  weights,
  onChange
}: {
  breed: BreedConfig
  weights: Record<string, number>
  onChange: (w: Record<string, number>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="rounded-md border border-ranch-200 p-3">
      <button
        className="text-sm font-semibold text-ranch-800 flex items-center gap-2"
        onClick={() => setExpanded((e) => !e)}
      >
        <Plus size={14} className={expanded ? 'rotate-45 transition-transform' : 'transition-transform'} />
        Custom Weighted Index — My Ranch Priorities (total weight: {total})
      </button>
      {expanded && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          {breed.traits.map((t) => (
            <div key={t.key}>
              <label className="label">{t.key}</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={weights[t.key] ?? 0}
                onChange={(e) =>
                  onChange({ ...weights, [t.key]: Number(e.target.value) })
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
