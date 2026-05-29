import { useEffect, useState } from 'react'
import { PlusCircle, Trash2, Edit3, Save, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import GeneticConditionBadge from '../components/GeneticConditionBadge'
import { getBreedConfig, getBreedConfigs } from '../breeds'
import {
  createAnimal,
  deleteAnimal,
  listAnimals,
  listHerds,
  updateAnimal
} from '../db/queries'
import type { Animal, GeneticConditionStatus, Herd, WagyuSubtype } from '../types'

const WAGYU_SUBTYPES: { value: WagyuSubtype; label: string }[] = [
  { value: 'wagyu_black_fullblood_awa', label: 'Japanese Black — Fullblood (AWA)' },
  { value: 'wagyu_black_purebred_awa', label: 'Japanese Black — Purebred (AWA, ≥93.75%)' },
  { value: 'wagyu_black_f1', label: 'Japanese Black — F1 (50%)' },
  { value: 'wagyu_black_f2', label: 'Japanese Black — F2 (75%)' },
  { value: 'wagyu_black_f3', label: 'Japanese Black — F3 (87.5%)' },
  { value: 'wagyu_au_fullblood', label: 'Australian Wagyu — Fullblood (AWA-AU)' },
  { value: 'wagyu_au_purebred', label: 'Australian Wagyu — Purebred (AWA-AU)' },
  { value: 'wagyu_au_f1', label: 'Australian Wagyu — F1' },
  { value: 'wagyu_red_akaushi_fullblood', label: 'Japanese Red / Akaushi — Fullblood' },
  { value: 'wagyu_red_akaushi_purebred', label: 'Japanese Red / Akaushi — Purebred' }
]

function isWagyuBreed(breedId: string) {
  return breedId.startsWith('wagyu_')
}

export default function AnimalRegistryPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [herds, setHerds] = useState<Herd[]>([])
  const [editing, setEditing] = useState<Animal | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    const [a, h] = await Promise.all([
      listAnimals({ publicOnly: false }),
      listHerds()
    ])
    setAnimals(a)
    setHerds(h)
  }

  return (
    <div>
      <PageHeader
        title="Animal Registry"
        subtitle="Personal animal records — stored locally. Supports breed-appropriate EPDs, Wagyu subtypes, prefectural composition, and genetic-condition status."
        right={
          !adding && !editing ? (
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <PlusCircle size={14} /> Add Animal
            </button>
          ) : null
        }
      />

      <div className="p-8 space-y-6">
        {(adding || editing) && (
          <AnimalForm
            animal={editing}
            herds={herds}
            onCancel={() => {
              setAdding(false)
              setEditing(null)
            }}
            onSave={async (a) => {
              if (a.id) {
                await updateAnimal(a)
              } else {
                await createAnimal(a)
              }
              setAdding(false)
              setEditing(null)
              await refresh()
            }}
          />
        )}

        <section className="card">
          <div className="card-header">
            <h2 className="font-semibold">All Animals</h2>
            <span className="text-sm text-ranch-500">{animals.length} total</span>
          </div>
          <div className="card-body p-0">
            {animals.length === 0 ? (
              <div className="p-6 text-sm text-ranch-600">
                No animals registered yet. Click "Add Animal" to create one.
              </div>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reg #</th>
                    <th>Breed / Subtype</th>
                    <th>Sex</th>
                    <th>Birth Year</th>
                    <th>Herd</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {animals.map((a) => {
                    const breed = getBreedConfig(a.breedId)
                    const herd = herds.find((h) => h.id === a.herdId)
                    const subtypeLabel = WAGYU_SUBTYPES.find(
                      (s) => s.value === a.wagyuSubtype
                    )?.label
                    return (
                      <tr key={a.id}>
                        <td className="font-medium">{a.name}</td>
                        <td className="font-mono text-xs">{a.registrationNumber ?? '—'}</td>
                        <td>
                          <div>{breed?.name ?? a.breedId}</div>
                          {subtypeLabel && (
                            <div className="text-xs text-ranch-500">{subtypeLabel}</div>
                          )}
                        </td>
                        <td className="capitalize">{a.sex}</td>
                        <td>{a.birthYear ?? '—'}</td>
                        <td>{herd?.name ?? '—'}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="btn-secondary"
                              onClick={() => setEditing(a)}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn-danger"
                              onClick={async () => {
                                if (
                                  confirm(`Delete ${a.name}? This cannot be undone.`)
                                ) {
                                  await deleteAnimal(a.id!)
                                  await refresh()
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function AnimalForm({
  animal,
  herds,
  onCancel,
  onSave
}: {
  animal: Animal | null
  herds: Herd[]
  onCancel: () => void
  onSave: (a: Animal) => Promise<void>
}) {
  const breeds = getBreedConfigs()
  const [form, setForm] = useState<Animal>(
    animal ?? {
      name: '',
      breedId: breeds[0]?.id ?? '',
      sex: 'bull',
      epds: {},
      geneticConditionStatus: {}
    }
  )

  const breedConfig = getBreedConfig(form.breedId)
  const isWagyu = isWagyuBreed(form.breedId)

  function setEpd(key: string, value: string) {
    const n = value === '' ? null : parseFloat(value)
    setForm({
      ...form,
      epds: { ...form.epds, [key]: Number.isNaN(n) ? null : n }
    })
  }

  function setCondition(code: string, status: GeneticConditionStatus) {
    setForm({
      ...form,
      geneticConditionStatus: { ...(form.geneticConditionStatus ?? {}), [code]: status }
    })
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="font-semibold">
          {animal ? 'Edit Animal' : 'Add Animal'}
        </h2>
        <button className="btn-secondary" onClick={onCancel}>
          <X size={14} /> Cancel
        </button>
      </div>
      <div className="card-body space-y-6">
        {/* Basics */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Registration #</label>
            <input
              className="input"
              value={form.registrationNumber ?? ''}
              onChange={(e) =>
                setForm({ ...form, registrationNumber: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Tattoo</label>
            <input
              className="input"
              value={form.tattoo ?? ''}
              onChange={(e) => setForm({ ...form, tattoo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Sex</label>
            <select
              className="input"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value as Animal['sex'] })}
            >
              <option value="bull">Bull</option>
              <option value="cow">Cow</option>
              <option value="heifer">Heifer</option>
              <option value="steer">Steer</option>
            </select>
          </div>

          <div>
            <label className="label">Breed</label>
            <select
              className="input"
              value={form.breedId}
              onChange={(e) =>
                setForm({
                  ...form,
                  breedId: e.target.value,
                  epds: {},
                  wagyuSubtype: undefined
                })
              }
            >
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {isWagyu && (
            <div className="col-span-2">
              <label className="label">Wagyu Subtype</label>
              <select
                className="input"
                value={form.wagyuSubtype ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    wagyuSubtype: (e.target.value || undefined) as WagyuSubtype | undefined
                  })
                }
              >
                <option value="">Select subtype…</option>
                {WAGYU_SUBTYPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Birth Year</label>
            <input
              className="input"
              type="number"
              value={form.birthYear ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  birthYear: e.target.value ? Number(e.target.value) : undefined
                })
              }
            />
          </div>
          <div>
            <label className="label">Herd</label>
            <select
              className="input"
              value={form.herdId ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  herdId: e.target.value ? Number(e.target.value) : undefined
                })
              }
            >
              <option value="">No herd</option>
              {herds
                .filter((h) => h.breedId === form.breedId)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* EPDs */}
        {breedConfig && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
              {breedConfig.evaluationSystem} Values
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {breedConfig.traits.map((t) => (
                <div key={t.key}>
                  <label className="label">
                    {t.key}
                    <span className="ml-1 text-ranch-400 font-normal normal-case">
                      ({t.unit})
                    </span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={form.epds[t.key] == null ? '' : String(form.epds[t.key])}
                    onChange={(e) => setEpd(t.key, e.target.value)}
                  />
                  <div className="text-[11px] text-ranch-500 mt-0.5">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genetic conditions */}
        {breedConfig?.geneticConditions && breedConfig.geneticConditions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
              Genetic Condition Status
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {breedConfig.geneticConditions.map((code) => {
                const status = form.geneticConditionStatus?.[code] ?? 'Unknown'
                return (
                  <div key={code} className="flex items-center gap-3">
                    <div className="w-40">
                      <GeneticConditionBadge code={code} status={status} />
                    </div>
                    <select
                      className="input"
                      value={status}
                      onChange={(e) =>
                        setCondition(code, e.target.value as GeneticConditionStatus)
                      }
                    >
                      <option value="Unknown">Unknown</option>
                      <option value="Free">Free (TM)</option>
                      <option value="Carrier">Carrier (TM*C)</option>
                      <option value="Affected">Affected</option>
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Prefectural composition (AWA-AU) */}
        {breedConfig?.prefecturalTracking && breedConfig.prefecturalTraits && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
              Prefectural Composition (%)
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {breedConfig.prefecturalTraits.map((p) => {
                const field = p.key.replace('pct_', '') as keyof NonNullable<Animal['prefecturalComposition']>
                return (
                  <div key={p.key}>
                    <label className="label">{p.label}</label>
                    <input
                      className="input"
                      type="number"
                      step="0.1"
                      value={
                        (form.prefecturalComposition?.[field] as number | undefined) ??
                        ''
                      }
                      onChange={(e) => {
                        const n = e.target.value ? Number(e.target.value) : undefined
                        setForm({
                          ...form,
                          prefecturalComposition: {
                            ...(form.prefecturalComposition ?? {}),
                            [field]: n
                          }
                        })
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="btn-primary"
            disabled={!form.name || !form.breedId}
            onClick={() => void onSave(form)}
          >
            <Save size={14} /> Save Animal
          </button>
        </div>
      </div>
    </section>
  )
}
