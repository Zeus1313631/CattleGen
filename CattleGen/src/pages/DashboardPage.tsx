import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Play,
  PlusCircle,
  Upload,
  Database,
  AlertTriangle
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getBreedConfig, getBreedConfigs } from '../breeds'
import {
  countAll,
  getMyRanch,
  getRecentMatings,
  listAnimals
} from '../db/queries'
import type { Animal, Ranch } from '../types'
import type { NavKey } from '../App'

export default function DashboardPage({
  onNavigate
}: {
  onNavigate: (k: NavKey) => void
}) {
  const [ranch, setRanch] = useState<Ranch | null>(null)
  const [counts, setCounts] = useState({ animals: 0, herds: 0, matings: 0 })
  const [animals, setAnimals] = useState<Animal[]>([])
  const [recentMatings, setRecentMatings] = useState<
    Array<{ id: number; breed_id: string; created_at: string }>
  >([])
  const [spotlightBreed, setSpotlightBreed] = useState<string>('wagyu_black_awa')

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    const [r, c, a, m] = await Promise.all([
      getMyRanch(),
      countAll(),
      listAnimals({ publicOnly: false }),
      getRecentMatings(5)
    ])
    setRanch(r)
    setCounts(c)
    setAnimals(a)
    setRecentMatings(m as any)
  }

  const breedsRepresented = useMemo(() => {
    const set = new Set(animals.map((a) => a.breedId))
    return [...set]
  }, [animals])

  const geneticWarnings = useMemo(() => {
    const warnings: Array<{ code: string; carriers: Animal[] }> = []
    const byCode: Record<string, Animal[]> = {}
    for (const a of animals) {
      for (const [code, status] of Object.entries(a.geneticConditionStatus ?? {})) {
        if (status === 'Carrier' || status === 'Affected') {
          byCode[code] = byCode[code] ?? []
          byCode[code].push(a)
        }
      }
    }
    for (const [code, list] of Object.entries(byCode)) {
      if (list.length >= 2) warnings.push({ code, carriers: list })
    }
    return warnings
  }, [animals])

  const recentAnimals = [...animals]
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    .slice(0, 3)

  const isWagyuHerd = breedsRepresented.some((b) => b.startsWith('wagyu_'))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          ranch
            ? `${ranch.name}${ranch.location ? ' · ' + ranch.location : ''}`
            : 'Welcome — set up your ranch to get started.'
        }
      />

      <div className="p-8 space-y-6">
        {/* My Ranch summary */}
        <section className="grid grid-cols-4 gap-4">
          <SummaryCard
            icon={<LayoutDashboard size={18} />}
            label="Animals"
            value={counts.animals.toString()}
          />
          <SummaryCard
            icon={<Database size={18} />}
            label="Herds"
            value={counts.herds.toString()}
          />
          <SummaryCard
            icon={<Play size={18} />}
            label="Predictions Run"
            value={counts.matings.toString()}
          />
          <SummaryCard
            icon={<LayoutDashboard size={18} />}
            label="Breeds Represented"
            value={breedsRepresented.length.toString()}
          />
        </section>

        {/* Genetic condition warnings */}
        {geneticWarnings.length > 0 && (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-700 shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-amber-900">
                  Genetic Condition Alerts
                </h3>
                <p className="text-sm text-amber-900 mt-1">
                  When both sire and dam are carriers of the same condition,
                  25% of progeny will be affected. Avoid those matings.
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  {geneticWarnings.map((w) => (
                    <li key={w.code}>
                      <strong>{w.code}</strong> — {w.carriers.length} carrier(s):{' '}
                      {w.carriers.map((a) => a.name).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Breed Spotlight */}
          <section className="card col-span-2">
            <div className="card-header">
              <h2 className="font-semibold">Breed Spotlight</h2>
              <select
                className="input w-64"
                value={spotlightBreed}
                onChange={(e) => setSpotlightBreed(e.target.value)}
              >
                {getBreedConfigs().map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="card-body">
              {(() => {
                const b = getBreedConfig(spotlightBreed)
                if (!b) return null
                const top = b.traits.slice(0, 6)
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-ranch-500">
                          {b.association} · {b.evaluationSystem}
                        </div>
                        <div className="text-lg font-semibold">{b.name}</div>
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => onNavigate('public')}
                      >
                        View in Public Database
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-xs">
                      {top.map((t) => (
                        <div
                          key={t.key}
                          className="rounded-md border border-ranch-200 px-2 py-2"
                        >
                          <div className="font-mono text-ranch-500">{t.key}</div>
                          <div className="font-semibold tabular-nums">
                            {b.breedAverages[t.key]?.toFixed(2) ?? '—'}
                          </div>
                          <div className="text-ranch-500 mt-0.5">avg</div>
                        </div>
                      ))}
                    </div>
                    {b.sixEssentials && (
                      <div className="text-xs text-ranch-700 mt-2">
                        <strong>Six Essentials:</strong>{' '}
                        {b.sixEssentials.join(' · ')}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="card">
            <div className="card-header">
              <h2 className="font-semibold">Quick Actions</h2>
            </div>
            <div className="card-body flex flex-col gap-2">
              <button
                className="btn-primary justify-start"
                onClick={() => onNavigate('predictions')}
              >
                <Play size={14} /> Run New Prediction
              </button>
              <button
                className="btn-secondary justify-start"
                onClick={() => onNavigate('animals')}
              >
                <PlusCircle size={14} /> Add Animal to My Ranch
              </button>
              <button
                className="btn-secondary justify-start"
                onClick={() => onNavigate('genomics')}
              >
                <Upload size={14} /> Import Genomic Report
              </button>
              <button
                className="btn-secondary justify-start"
                onClick={() => onNavigate('public')}
              >
                <Database size={14} /> View Public Database
              </button>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Activity */}
          <section className="card col-span-2">
            <div className="card-header">
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
            <div className="card-body">
              <h3 className="text-xs uppercase tracking-wide text-ranch-600">
                Last 5 Predictions
              </h3>
              {recentMatings.length === 0 ? (
                <p className="text-sm text-ranch-500 mt-1">None yet.</p>
              ) : (
                <ul className="mt-2 text-sm space-y-1">
                  {recentMatings.map((m) => (
                    <li key={m.id}>
                      <span className="font-mono text-xs text-ranch-500">
                        #{m.id}
                      </span>{' '}
                      {getBreedConfig(m.breed_id)?.name ?? m.breed_id} ·{' '}
                      {new Date(m.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="text-xs uppercase tracking-wide text-ranch-600 mt-6">
                Last 3 Animals Added
              </h3>
              {recentAnimals.length === 0 ? (
                <p className="text-sm text-ranch-500 mt-1">None yet.</p>
              ) : (
                <ul className="mt-2 text-sm space-y-1">
                  {recentAnimals.map((a) => (
                    <li key={a.id}>
                      <strong>{a.name}</strong> —{' '}
                      {getBreedConfig(a.breedId)?.name} · {a.sex}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Wagyu Marbling reference */}
          {isWagyuHerd && <MarblingReferenceCard />}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center gap-2 text-ranch-600">
          {icon}
          <div className="text-xs uppercase tracking-wide font-semibold">
            {label}
          </div>
        </div>
        <div className="text-3xl font-bold text-ranch-950 tabular-nums mt-1">
          {value}
        </div>
      </div>
    </div>
  )
}

function MarblingReferenceCard() {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="font-semibold">Wagyu Marbling Scale Reference</h2>
      </div>
      <div className="card-body text-sm space-y-3">
        <div>
          <div className="font-semibold text-ranch-800">AUS-MEAT Marble Score</div>
          <p className="text-ranch-700">
            Australian scale 0-9+ (higher = more marbling). Used by AWA-AU WBVs.
          </p>
        </div>
        <div>
          <div className="font-semibold text-ranch-800">USDA Marbling Score</div>
          <p className="text-ranch-700">
            US scale: Slight, Small, Modest, Moderate, Slightly Abundant,
            Moderately Abundant, Abundant. Used by AWA (US) and all US breed EPDs.
          </p>
        </div>
        <div>
          <div className="font-semibold text-ranch-800">BMS (Japanese)</div>
          <p className="text-ranch-700">
            Beef Marbling Standard 1-12 paired with A1-A12 quality grade.
          </p>
        </div>
        <div className="rounded-md bg-ranch-100 p-2 text-xs text-ranch-700">
          AWA (US) EPDs use the USDA scale. AWA-AU WBVs use the AUS-MEAT scale.
          These are <strong>not</strong> the same scale — never compare the numbers directly.
        </div>
      </div>
    </section>
  )
}
