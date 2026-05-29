import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  Save,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Info
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getBreedConfigs } from '../breeds'
import {
  getAllSettings,
  listAnimals,
  setSetting,
  upsertMyRanch,
  getMyRanch
} from '../db/queries'
import type { Ranch } from '../types'

interface DataSource {
  association: string
  name: string
  urls: string[]
  notes?: string
}

const DATA_SOURCES: DataSource[] = [
  {
    association: 'American Wagyu Association',
    name: 'AWA',
    urls: ['https://wagyu.org/for-members/genetic-evaluations']
  },
  {
    association: 'Australian Wagyu Association',
    name: 'AWA-AU',
    urls: ['https://www.wagyu.org.au'],
    notes: 'Sire summaries via the Helical platform (login required).'
  },
  {
    association: 'American Angus Association',
    name: 'AAA',
    urls: ['https://www.angus.org/tools-resources/national-cattle-evaluation']
  },
  {
    association: 'American Hereford Association',
    name: 'AHA',
    urls: ['https://www.hereford.org']
  },
  {
    association: 'American Akaushi Association',
    name: 'Akaushi',
    urls: ['https://www.akaushi.com']
  },
  {
    association: 'American Simmental Association',
    name: 'ASA',
    urls: ['https://www.simmental.org']
  },
  {
    association: 'Red Angus Association of America',
    name: 'RAAA',
    urls: ['https://www.redangus.org']
  },
  {
    association: 'North American Limousin Foundation',
    name: 'NALF',
    urls: ['https://www.nalf.org']
  },
  {
    association: 'American Brahman Breeders Association',
    name: 'ABBA',
    urls: ['https://www.brahman.org']
  },
  {
    association: 'Beefmaster Breeders United',
    name: 'BBU',
    urls: ['https://beefmasters.org', 'https://beefmaster.digitalbeef.com'],
    notes:
      'Monthly evaluations via the DigitalBeef platform (changed from quarterly in 2024). GE-EPDs require the 100K Neogen SNP panel.'
  }
]

const APP_VERSION = '0.1.0'

export default function SettingsPage() {
  const [ranch, setRanch] = useState<Ranch | null>(null)
  const [defaults, setDefaults] = useState<{
    defaultBreed: string
    primarySystem: 'EPD' | 'WBV'
    units: 'imperial' | 'metric'
    marblingDisplay: 'USDA' | 'AUS-MEAT' | 'BMS'
    defaultChart: 'radar' | 'bar' | 'table'
  }>({
    defaultBreed: 'wagyu_black_awa',
    primarySystem: 'EPD',
    units: 'imperial',
    marblingDisplay: 'USDA',
    defaultChart: 'radar'
  })

  useEffect(() => {
    void (async () => {
      setRanch(await getMyRanch())
      const s = await getAllSettings()
      setDefaults((d) => ({
        ...d,
        defaultBreed: s.defaultBreed ?? d.defaultBreed,
        primarySystem: (s.primarySystem as 'EPD' | 'WBV') ?? d.primarySystem,
        units: (s.units as 'imperial' | 'metric') ?? d.units,
        marblingDisplay:
          (s.marblingDisplay as 'USDA' | 'AUS-MEAT' | 'BMS') ?? d.marblingDisplay,
        defaultChart: (s.defaultChart as 'radar' | 'bar' | 'table') ?? d.defaultChart
      }))
    })()
  }, [])

  async function saveDefaults() {
    await Promise.all(
      Object.entries(defaults).map(([k, v]) => setSetting(k, String(v)))
    )
    alert('Preferences saved.')
  }

  async function saveRanch() {
    if (!ranch || !ranch.name) return
    await upsertMyRanch(ranch)
    alert('Ranch profile saved.')
  }

  async function exportCsv() {
    const animals = await listAnimals({ publicOnly: false })
    const header = [
      'id',
      'name',
      'registration_number',
      'breed_id',
      'sex',
      'birth_year',
      'epds'
    ]
    const rows = animals.map((a) =>
      [
        a.id,
        a.name,
        a.registrationNumber ?? '',
        a.breedId,
        a.sex,
        a.birthYear ?? '',
        JSON.stringify(a.epds).replace(/"/g, '""')
      ]
        .map((v) => `"${String(v)}"`)
        .join(',')
    )
    const csv = [header.join(','), ...rows].join('\n')

    const res = await window.cattlegen.dialog.saveFile({
      title: 'Export My Ranch animals',
      defaultPath: `cattlegen_animals_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (!res.canceled && res.filePath) {
      const blob = new Blob([csv], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = res.filePath.split('/').pop() ?? 'export.csv'
      a.click()
    }
  }

  const breeds = getBreedConfigs()

  return (
    <div>
      <PageHeader title="Settings" subtitle="Ranch profile, preferences, data sources, and export." />

      <div className="p-8 space-y-6 max-w-5xl">
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <SettingsIcon size={18} className="text-ranch-700" />
              <h2 className="font-semibold">My Ranch Setup</h2>
            </div>
            <button className="btn-primary" onClick={saveRanch} disabled={!ranch?.name}>
              <Save size={14} /> Save Ranch
            </button>
          </div>
          <div className="card-body grid grid-cols-3 gap-4">
            <div>
              <label className="label">Ranch Name</label>
              <input
                className="input"
                value={ranch?.name ?? ''}
                onChange={(e) =>
                  setRanch({ ...(ranch ?? { isMyRanch: true }), name: e.target.value, isMyRanch: true })
                }
              />
            </div>
            <div>
              <label className="label">Owner</label>
              <input
                className="input"
                value={ranch?.ownerName ?? ''}
                onChange={(e) =>
                  setRanch({
                    ...(ranch ?? { name: '', isMyRanch: true }),
                    ownerName: e.target.value,
                    isMyRanch: true
                  })
                }
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={ranch?.location ?? ''}
                onChange={(e) =>
                  setRanch({
                    ...(ranch ?? { name: '', isMyRanch: true }),
                    location: e.target.value,
                    isMyRanch: true
                  })
                }
              />
            </div>
            <div>
              <label className="label">Default Breed</label>
              <select
                className="input"
                value={defaults.defaultBreed}
                onChange={(e) => setDefaults({ ...defaults, defaultBreed: e.target.value })}
              >
                {breeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Primary Evaluation System</label>
              <select
                className="input"
                value={defaults.primarySystem}
                onChange={(e) =>
                  setDefaults({ ...defaults, primarySystem: e.target.value as 'EPD' | 'WBV' })
                }
              >
                <option value="EPD">EPD (US)</option>
                <option value="WBV">WBV (AWA-AU)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="font-semibold">Display Preferences</h2>
            <button className="btn-primary" onClick={saveDefaults}>
              <Save size={14} /> Save Preferences
            </button>
          </div>
          <div className="card-body grid grid-cols-3 gap-4">
            <div>
              <label className="label">Units</label>
              <select
                className="input"
                value={defaults.units}
                onChange={(e) =>
                  setDefaults({ ...defaults, units: e.target.value as 'imperial' | 'metric' })
                }
              >
                <option value="imperial">Imperial (lbs, in)</option>
                <option value="metric">Metric (kg, cm)</option>
              </select>
            </div>
            <div>
              <label className="label">Marbling Scale Display</label>
              <select
                className="input"
                value={defaults.marblingDisplay}
                onChange={(e) =>
                  setDefaults({
                    ...defaults,
                    marblingDisplay: e.target.value as 'USDA' | 'AUS-MEAT' | 'BMS'
                  })
                }
              >
                <option value="USDA">USDA</option>
                <option value="AUS-MEAT">AUS-MEAT (0-9+)</option>
                <option value="BMS">BMS (1-12)</option>
              </select>
            </div>
            <div>
              <label className="label">Default Prediction Chart</label>
              <select
                className="input"
                value={defaults.defaultChart}
                onChange={(e) =>
                  setDefaults({
                    ...defaults,
                    defaultChart: e.target.value as 'radar' | 'bar' | 'table'
                  })
                }
              >
                <option value="radar">Radar</option>
                <option value="bar">Bar</option>
                <option value="table">Table</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-ranch-700" />
              <h2 className="font-semibold">Data Sources</h2>
            </div>
            <button
              className="btn-secondary"
              onClick={() =>
                alert(
                  'Refresh Data\n\nTo update public sire data:\n' +
                    '1) Visit each association\'s link below\n' +
                    '2) Download the latest sire summary (usually CSV)\n' +
                    '3) Replace the corresponding file in src/publicData/ OR use a future import tool\n\n' +
                    'Downloaded data is stored locally — no automatic sync.'
                )
              }
            >
              <RefreshCw size={14} /> Refresh Data
            </button>
          </div>
          <div className="card-body">
            <p className="text-sm text-ranch-700 mb-3">
              Public sire summary data is included as pre-loaded JSON snapshots.
              To refresh, manually download the latest summaries from each
              association and re-import.
            </p>
            <ul className="divide-y divide-ranch-100">
              {DATA_SOURCES.map((ds) => (
                <li key={ds.name} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-ranch-900">
                      {ds.association}{' '}
                      <span className="ml-2 font-mono text-xs text-ranch-500">{ds.name}</span>
                    </div>
                    {ds.notes && (
                      <div className="text-xs text-ranch-600 mt-0.5">{ds.notes}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {ds.urls.map((u) => (
                      <button
                        key={u}
                        className="text-xs text-ranch-700 hover:text-ranch-900 inline-flex items-center gap-1"
                        onClick={() => window.cattlegen.shell.openExternal(u)}
                      >
                        <ExternalLink size={12} /> {u.replace(/^https?:\/\//, '')}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="font-semibold">Export / Backup</h2>
          </div>
          <div className="card-body flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={exportCsv}>
              <Download size={14} /> Export Animals to CSV
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                alert(
                  'PDF export coming soon.\n\nThis will render your recent predictions as a printable summary report.'
                )
              }
            >
              <Download size={14} /> Export Predictions to PDF
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                alert(
                  'Backup is written to your app data folder:\n\n~/Library/Application Support/CattleGen/cattlegen.sqlite (macOS)\n\nCopy it to a safe location for backup.'
                )
              }
            >
              <Upload size={14} /> Backup Database Location
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-ranch-700" />
              <h2 className="font-semibold">About</h2>
            </div>
          </div>
          <div className="card-body text-sm space-y-2">
            <div>
              <strong>CattleGen</strong> · v{APP_VERSION}
            </div>
            <div className="text-ranch-700">
              Local-first cattle breeding prediction, EPD/WBV comparison, and
              ranch management. All ranch data stays on this device unless you
              explicitly export it.
            </div>
            <div className="text-ranch-500 text-xs">
              Breed data last updated:{' '}
              {new Date().toISOString().slice(0, 10)} (placeholder snapshot)
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
