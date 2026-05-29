import { useEffect, useMemo, useState } from 'react'
import { Database, Search, ArrowUpDown, X, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PercentileBadge from '../components/PercentileBadge'
import { getBreedConfig, getBreedConfigs } from '../breeds'
import { PUBLIC_SIRE_SUMMARIES } from '../publicData'
import { estimatePercentile } from '../engine/predictionEngine'
import { createAnimal } from '../db/queries'
import type {
  BreedConfig,
  EvaluationSystem,
  PublicSireRecord
} from '../types'

const PAGE_SIZE = 50

export default function PublicDatabasePage() {
  const [allRecords] = useState(() => {
    const out: PublicSireRecord[] = []
    for (const file of PUBLIC_SIRE_SUMMARIES) {
      out.push(...file.records)
    }
    return out
  })

  const [breedFilter, setBreedFilter] = useState<string>('')
  const [associationFilter, setAssociationFilter] = useState<string>('')
  const [systemFilter, setSystemFilter] = useState<EvaluationSystem | ''>('')
  const [query, setQuery] = useState('')
  const [sortTrait, setSortTrait] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [traitFilters, setTraitFilters] = useState<
    Array<{ trait: string; min?: number; max?: number }>
  >([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [detailRecord, setDetailRecord] = useState<PublicSireRecord | null>(null)

  const breeds = getBreedConfigs()
  const activeBreed = getBreedConfig(breedFilter)

  useEffect(() => {
    setPage(0)
    if (activeBreed) {
      setSelectedColumns(activeBreed.traits.slice(0, 6).map((t) => t.key))
    } else {
      setSelectedColumns(['BW', 'WW', 'YW', 'Marb', 'RE', 'CW'])
    }
    setTraitFilters([])
    setSortTrait('')
  }, [breedFilter])

  const filtered = useMemo(() => {
    let out = allRecords
    if (breedFilter) out = out.filter((r) => r.breedId === breedFilter)
    if (associationFilter) out = out.filter((r) => r.dataSource === associationFilter)
    if (systemFilter) {
      out = out.filter((r) => {
        const bc = getBreedConfig(r.breedId)
        return bc?.evaluationSystem === systemFilter
      })
    }
    if (query) {
      const q = query.toLowerCase()
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.registrationNumber.toLowerCase().includes(q)
      )
    }
    if (traitFilters.length > 0) {
      out = out.filter((r) =>
        traitFilters.every(({ trait, min, max }) => {
          const v = r.epds[trait]
          if (typeof v !== 'number') return false
          if (min != null && v < min) return false
          if (max != null && v > max) return false
          return true
        })
      )
    }
    if (sortTrait) {
      const dir = sortDir === 'asc' ? 1 : -1
      out = [...out].sort((a, b) => {
        const av = a.epds[sortTrait]
        const bv = b.epds[sortTrait]
        if (typeof av !== 'number' && typeof bv !== 'number') return 0
        if (typeof av !== 'number') return 1
        if (typeof bv !== 'number') return -1
        return (av - bv) * dir
      })
    }
    return out
  }, [allRecords, breedFilter, associationFilter, systemFilter, query, traitFilters, sortTrait, sortDir])

  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Public Database"
        subtitle="Searchable public sire summary data. Pre-loaded placeholder records; refresh via Settings → Data Sources."
      />

      <div className="p-8 space-y-6">
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-ranch-700" />
              <h2 className="font-semibold">Search & Filter</h2>
            </div>
          </div>
          <div className="card-body grid grid-cols-5 gap-4">
            <div>
              <label className="label">Breed / Subtype</label>
              <select
                className="input"
                value={breedFilter}
                onChange={(e) => setBreedFilter(e.target.value)}
              >
                <option value="">All breeds</option>
                {breeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Association</label>
              <select
                className="input"
                value={associationFilter}
                onChange={(e) => setAssociationFilter(e.target.value)}
              >
                <option value="">All</option>
                {['AWA', 'AWA-AU', 'AAA', 'AHA', 'ASA', 'NALF', 'ABBA', 'RAAA', 'Akaushi', 'BBU'].map(
                  (a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="label">Evaluation System</label>
              <select
                className="input"
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value as EvaluationSystem | '')}
              >
                <option value="">Both</option>
                <option value="EPD">EPD (US)</option>
                <option value="WBV">WBV (AWA-AU)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Search name / registration #</label>
              <input
                className="input"
                placeholder="e.g. FB00000001"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {activeBreed && (
              <div className="col-span-5">
                <TraitFilters
                  breed={activeBreed}
                  filters={traitFilters}
                  onChange={setTraitFilters}
                />
              </div>
            )}

            {activeBreed && (
              <div className="col-span-5">
                <label className="label">Visible columns</label>
                <div className="flex flex-wrap gap-2">
                  {activeBreed.traits.map((t) => {
                    const on = selectedColumns.includes(t.key)
                    return (
                      <button
                        key={t.key}
                        onClick={() =>
                          setSelectedColumns((cols) =>
                            on ? cols.filter((c) => c !== t.key) : [...cols, t.key]
                          )
                        }
                        className={`px-2 py-1 rounded-md text-xs font-medium border ${
                          on
                            ? 'bg-ranch-700 text-ranch-50 border-ranch-700'
                            : 'bg-white text-ranch-700 border-ranch-300'
                        }`}
                      >
                        {t.key}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="font-semibold">
              {filtered.length} record{filtered.length === 1 ? '' : 's'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-ranch-600">
                Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
              </span>
              <button
                className="btn-secondary"
                disabled={(page + 1) * PAGE_SIZE >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
          <div className="card-body p-0 overflow-x-auto">
            {paged.length === 0 ? (
              <div className="p-6 text-sm text-ranch-600">
                No records match the current filters.
              </div>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reg #</th>
                    <th>Breed</th>
                    <th>Assoc.</th>
                    {selectedColumns.map((k) => (
                      <th key={k}>
                        <button
                          className="flex items-center gap-1 hover:text-ranch-900"
                          onClick={() => {
                            if (sortTrait === k) {
                              setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortTrait(k)
                              setSortDir('desc')
                            }
                          }}
                        >
                          {k} <ArrowUpDown size={10} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => {
                    const breed = getBreedConfig(r.breedId)
                    return (
                      <tr
                        key={r.registrationNumber}
                        onClick={() => setDetailRecord(r)}
                        className="cursor-pointer hover:bg-ranch-50"
                      >
                        <td className="font-medium">{r.name}</td>
                        <td className="font-mono text-xs">{r.registrationNumber}</td>
                        <td>{breed?.name ?? r.breedId}</td>
                        <td>{r.dataSource}</td>
                        {selectedColumns.map((k) => {
                          const v = r.epds[k]
                          const trait = breed?.traits.find((t) => t.key === k)
                          const range = breed?.percentileRanges[k]
                          let cellClass = ''
                          if (typeof v === 'number' && trait && range) {
                            const pct = estimatePercentile(v, range, trait.higherIsBetter)
                            cellClass =
                              pct >= 75
                                ? 'bg-emerald-50 text-emerald-900'
                                : pct <= 25
                                  ? 'bg-wagyu-50 text-wagyu-900'
                                  : 'bg-amber-50 text-amber-900'
                          }
                          return (
                            <td key={k} className={`${cellClass} tabular-nums`}>
                              {typeof v === 'number' ? v.toFixed(2) : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {detailRecord && (
        <DetailPanel
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onImported={() => setDetailRecord(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function TraitFilters({
  breed,
  filters,
  onChange
}: {
  breed: BreedConfig
  filters: Array<{ trait: string; min?: number; max?: number }>
  onChange: (f: Array<{ trait: string; min?: number; max?: number }>) => void
}) {
  return (
    <div>
      <label className="label">Trait Range Filters</label>
      <div className="space-y-2">
        {filters.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              className="input w-40"
              value={f.trait}
              onChange={(e) => {
                const next = [...filters]
                next[i] = { ...next[i], trait: e.target.value }
                onChange(next)
              }}
            >
              {breed.traits.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.key}
                </option>
              ))}
            </select>
            <input
              className="input w-28"
              type="number"
              placeholder="Min"
              step="0.01"
              value={f.min ?? ''}
              onChange={(e) => {
                const next = [...filters]
                next[i] = {
                  ...next[i],
                  min: e.target.value === '' ? undefined : Number(e.target.value)
                }
                onChange(next)
              }}
            />
            <input
              className="input w-28"
              type="number"
              placeholder="Max"
              step="0.01"
              value={f.max ?? ''}
              onChange={(e) => {
                const next = [...filters]
                next[i] = {
                  ...next[i],
                  max: e.target.value === '' ? undefined : Number(e.target.value)
                }
                onChange(next)
              }}
            />
            <button
              className="btn-secondary"
              onClick={() => onChange(filters.filter((_, j) => j !== i))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          className="btn-secondary"
          onClick={() =>
            onChange([...filters, { trait: breed.traits[0].key }])
          }
        >
          <Plus size={14} /> Add filter
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function DetailPanel({
  record,
  onClose,
  onImported
}: {
  record: PublicSireRecord
  onClose: () => void
  onImported: () => void
}) {
  const breed = getBreedConfig(record.breedId)

  async function addToMyRanch() {
    await createAnimal({
      name: record.name,
      registrationNumber: record.registrationNumber,
      breedId: record.breedId,
      wagyuSubtype: record.wagyuSubtype,
      sex: 'bull',
      epds: record.epds,
      accuracy: record.accuracy,
      prefecturalComposition: record.prefecturalComposition,
      isPublicRecord: true,
      sourceAssociation: record.association,
      birthYear: record.birthYear
    })
    alert(`${record.name} added to My Ranch as a reference animal.`)
    onImported()
  }

  return (
    <div
      className="fixed inset-0 z-30 bg-ranch-950/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-[520px] h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-ranch-700" />
            <h2 className="font-semibold">{record.name}</h2>
          </div>
          <button className="text-ranch-500 hover:text-ranch-800" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="card-body space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail k="Registration" v={record.registrationNumber} />
            <Detail k="Association" v={record.association} />
            <Detail k="Breed" v={breed?.name ?? record.breedId} />
            <Detail k="Evaluation" v={breed?.evaluationSystem ?? '—'} />
            <Detail k="Birth Year" v={String(record.birthYear ?? '—')} />
            <Detail k="Last Updated" v={record.lastUpdated ?? '—'} />
          </div>

          {breed && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
                {breed.evaluationSystem} Profile
              </h3>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Trait</th>
                    <th>Value</th>
                    <th>Percentile</th>
                    <th>Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  {breed.traits.map((t) => {
                    const v = record.epds[t.key]
                    const range = breed.percentileRanges[t.key]
                    const pct =
                      typeof v === 'number' && range
                        ? estimatePercentile(v, range, t.higherIsBetter)
                        : null
                    const acc = record.accuracy?.[t.key]
                    return (
                      <tr key={t.key}>
                        <td>
                          <div className="font-mono text-xs text-ranch-600">
                            {t.key}
                          </div>
                          <div className="text-xs">{t.label}</div>
                        </td>
                        <td className="tabular-nums">
                          {typeof v === 'number'
                            ? `${v.toFixed(2)} ${t.unit}`
                            : '—'}
                        </td>
                        <td className="w-40">
                          {pct != null ? (
                            <div>
                              <div className="h-1.5 bg-ranch-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-ranch-600"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="mt-0.5">
                                <PercentileBadge percentile={pct} />
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="tabular-nums">
                          {typeof acc === 'number' ? acc.toFixed(2) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {record.prefecturalComposition && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
                Prefectural Composition
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(record.prefecturalComposition).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="capitalize text-ranch-700">{k}</span>
                    <span className="font-mono tabular-nums">{(v as number).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-ranch-100">
            <button className="btn-primary" onClick={addToMyRanch}>
              <Plus size={14} /> Add to My Ranch
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ranch-500">{k}</div>
      <div className="text-sm font-medium">{v}</div>
    </div>
  )
}
