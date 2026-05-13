import { useEffect, useMemo, useState } from 'react'
import { Home, PlusCircle, Trash2, Edit3, Save } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getBreedConfigs, getBreedConfig } from '../breeds'
import {
  countAll,
  createHerd,
  deleteHerd,
  getMyRanch,
  listAnimals,
  listHerds,
  updateHerd,
  upsertMyRanch
} from '../db/queries'
import type { Animal, Herd, Ranch } from '../types'

export default function MyRanchPage() {
  const [ranch, setRanch] = useState<Ranch | null>(null)
  const [editingRanch, setEditingRanch] = useState(false)
  const [herds, setHerds] = useState<Herd[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [counts, setCounts] = useState({ animals: 0, herds: 0, matings: 0 })
  const [selectedHerd, setSelectedHerd] = useState<number | 'all'>('all')

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    const [r, h, a, c] = await Promise.all([
      getMyRanch(),
      listHerds(),
      listAnimals({ publicOnly: false }),
      countAll()
    ])
    setRanch(r)
    setHerds(h)
    setAnimals(a)
    setCounts(c)
    if (!r) setEditingRanch(true)
  }

  const breedsRepresented = useMemo(() => {
    const set = new Set(animals.map((a) => a.breedId))
    return [...set]
  }, [animals])

  const filteredAnimals =
    selectedHerd === 'all'
      ? animals
      : animals.filter((a) => a.herdId === selectedHerd)

  return (
    <div>
      <PageHeader
        title="My Ranch"
        subtitle="Local-only ranch profile, herds, and animals. Data never leaves the device unless you export it."
      />

      <div className="p-8 space-y-6">
        <RanchProfileCard
          ranch={ranch}
          editing={editingRanch}
          onEdit={() => setEditingRanch(true)}
          onCancel={() => {
            setEditingRanch(false)
          }}
          onSave={async (r) => {
            await upsertMyRanch(r)
            setEditingRanch(false)
            await refresh()
          }}
          counts={counts}
          breedsRepresented={breedsRepresented}
        />

        <HerdsCard
          herds={herds}
          onCreate={async (h) => {
            await createHerd({ ...h, ranchId: ranch?.id })
            await refresh()
          }}
          onUpdate={async (h) => {
            await updateHerd(h)
            await refresh()
          }}
          onDelete={async (id) => {
            if (confirm('Delete this herd? Animals will stay but lose their herd link.')) {
              await deleteHerd(id)
              await refresh()
            }
          }}
        />

        <AnimalsListCard
          animals={filteredAnimals}
          herds={herds}
          selectedHerd={selectedHerd}
          onSelectHerd={setSelectedHerd}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function RanchProfileCard({
  ranch,
  editing,
  onEdit,
  onCancel,
  onSave,
  counts,
  breedsRepresented
}: {
  ranch: Ranch | null
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (r: Ranch) => Promise<void>
  counts: { animals: number; herds: number; matings: number }
  breedsRepresented: string[]
}) {
  const [form, setForm] = useState<Ranch>({
    name: ranch?.name ?? '',
    ownerName: ranch?.ownerName ?? '',
    location: ranch?.location ?? '',
    notes: ranch?.notes ?? '',
    isMyRanch: true
  })

  useEffect(() => {
    setForm({
      name: ranch?.name ?? '',
      ownerName: ranch?.ownerName ?? '',
      location: ranch?.location ?? '',
      notes: ranch?.notes ?? '',
      isMyRanch: true
    })
  }, [ranch])

  return (
    <section className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Home className="text-ranch-700" size={18} />
          <h2 className="font-semibold">Ranch Profile</h2>
        </div>
        {!editing && ranch && (
          <button onClick={onEdit} className="btn-secondary">
            <Edit3 size={14} /> Edit
          </button>
        )}
      </div>

      <div className="card-body">
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Ranch Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Owner Name</label>
              <input
                className="input"
                value={form.ownerName ?? ''}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location ?? ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, State / Region"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={2}
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                className="btn-primary"
                onClick={() => void onSave(form)}
                disabled={!form.name}
              >
                <Save size={14} /> Save Ranch
              </button>
              {ranch && (
                <button className="btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : ranch ? (
          <div className="grid grid-cols-4 gap-6">
            <Stat label="Ranch" value={ranch.name} />
            <Stat label="Owner" value={ranch.ownerName ?? '—'} />
            <Stat label="Location" value={ranch.location ?? '—'} />
            <Stat label="Primary Breeds" value={breedsRepresented.length ? breedsRepresented.map((b) => getBreedConfig(b)?.name ?? b).join(', ') : '—'} />
            <Stat label="Animals" value={counts.animals.toString()} />
            <Stat label="Herds" value={counts.herds.toString()} />
            <Stat label="Predictions" value={counts.matings.toString()} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ranch-500">{label}</div>
      <div className="text-lg font-semibold text-ranch-900 mt-1">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function HerdsCard({
  herds,
  onCreate,
  onUpdate,
  onDelete
}: {
  herds: Herd[]
  onCreate: (h: Herd) => Promise<void>
  onUpdate: (h: Herd) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Herd>({ name: '', breedId: '' })
  const breeds = getBreedConfigs()

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="font-semibold">My Herds</h2>
        {!adding && (
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <PlusCircle size={14} /> Add Herd
          </button>
        )}
      </div>
      <div className="card-body">
        {adding && (
          <div className="mb-4 p-3 rounded-md border border-ranch-200 bg-ranch-50 grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Herd name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              className="input"
              value={form.breedId}
              onChange={(e) => setForm({ ...form, breedId: e.target.value })}
            >
              <option value="">Select breed…</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="btn-primary"
                onClick={async () => {
                  await onCreate(form)
                  setForm({ name: '', breedId: '' })
                  setAdding(false)
                }}
                disabled={!form.name || !form.breedId}
              >
                Save
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setAdding(false)
                  setForm({ name: '', breedId: '' })
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {herds.length === 0 ? (
          <p className="text-sm text-ranch-600">No herds yet.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Herd</th>
                <th>Breed</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {herds.map((h) => (
                <HerdRow
                  key={h.id}
                  herd={h}
                  breeds={breeds}
                  onUpdate={onUpdate}
                  onDelete={() => h.id != null && onDelete(h.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function HerdRow({
  herd,
  breeds,
  onUpdate,
  onDelete
}: {
  herd: Herd
  breeds: ReturnType<typeof getBreedConfigs>
  onUpdate: (h: Herd) => Promise<void>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(herd)

  return (
    <tr>
      <td>
        {editing ? (
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        ) : (
          herd.name
        )}
      </td>
      <td>
        {editing ? (
          <select
            className="input"
            value={form.breedId}
            onChange={(e) => setForm({ ...form, breedId: e.target.value })}
          >
            {breeds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          getBreedConfig(herd.breedId)?.name ?? herd.breedId
        )}
      </td>
      <td className="text-right">
        {editing ? (
          <div className="flex justify-end gap-2">
            <button
              className="btn-primary"
              onClick={async () => {
                await onUpdate(form)
                setEditing(false)
              }}
            >
              Save
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditing(false)
                setForm(herd)
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              <Edit3 size={14} />
            </button>
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------

function AnimalsListCard({
  animals,
  herds,
  selectedHerd,
  onSelectHerd
}: {
  animals: Animal[]
  herds: Herd[]
  selectedHerd: number | 'all'
  onSelectHerd: (v: number | 'all') => void
}) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="font-semibold">My Animals</h2>
        <select
          className="input w-auto"
          value={selectedHerd === 'all' ? 'all' : String(selectedHerd)}
          onChange={(e) =>
            onSelectHerd(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
        >
          <option value="all">All herds</option>
          {herds.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <div className="card-body">
        {animals.length === 0 ? (
          <div className="text-sm text-ranch-600">
            No animals yet. Add one from the Animal Registry page.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Reg #</th>
                <th>Tattoo</th>
                <th>Breed</th>
                <th>Sex</th>
                <th>Birth Year</th>
                <th>Top EPDs</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a) => {
                const breed = getBreedConfig(a.breedId)
                const top = breed
                  ? breed.traits
                      .slice(0, 3)
                      .map((t) => {
                        const v = a.epds[t.key]
                        return typeof v === 'number'
                          ? `${t.key} ${v.toFixed(2)}`
                          : null
                      })
                      .filter(Boolean)
                      .join(' · ')
                  : ''
                return (
                  <tr key={a.id}>
                    <td className="font-medium">{a.name}</td>
                    <td>{a.registrationNumber ?? '—'}</td>
                    <td>{a.tattoo ?? '—'}</td>
                    <td>{breed?.name ?? a.breedId}</td>
                    <td className="capitalize">{a.sex}</td>
                    <td>{a.birthYear ?? '—'}</td>
                    <td className="text-xs font-mono text-ranch-700">{top || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
