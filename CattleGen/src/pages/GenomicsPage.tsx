import { useEffect, useState } from 'react'
import { Dna, Upload, FileText, Link as LinkIcon } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import GeneticConditionBadge from '../components/GeneticConditionBadge'
import { parseGenomicReport, type LabFormat } from '../genomics/importParser'
import { listAnimals, updateAnimal } from '../db/queries'
import { getBreedConfig } from '../breeds'
import type { Animal, GenomicImportResult } from '../types'

export default function GenomicsPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [parsed, setParsed] = useState<GenomicImportResult | null>(null)
  const [sourcePath, setSourcePath] = useState<string | null>(null)
  const [linkedAnimalId, setLinkedAnimalId] = useState<number | ''>('')
  const [format, setFormat] = useState<LabFormat | 'auto'>('auto')
  const [showMapping, setShowMapping] = useState(false)
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setAnimals(await listAnimals({ publicOnly: false }))
  }

  async function openFile() {
    const res = await window.cattlegen.dialog.openFile({
      filters: [
        { name: 'Genomic reports', extensions: ['csv', 'pdf', 'txt'] },
        { name: 'All files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (res.canceled || res.filePaths.length === 0) return
    const path = res.filePaths[0]
    const contents = await window.cattlegen.file.readText(path)
    setSourcePath(path)
    const result = parseGenomicReport(contents, path, {
      format: format === 'auto' ? undefined : format,
      columnMap: Object.keys(columnMap).length > 0 ? columnMap : undefined
    })
    setParsed(result)
    if (!result.success && format === 'auto') {
      setShowMapping(true)
    }
  }

  async function linkToAnimal() {
    if (!parsed?.parsedData || !linkedAnimalId) return
    const animal = animals.find((a) => a.id === linkedAnimalId)
    if (!animal) return

    const merged: Animal = {
      ...animal,
      genomicData: {
        ...(animal.genomicData ?? {}),
        ...parsed.parsedData,
        testDate: parsed.parsedData.testDate ?? new Date().toISOString().slice(0, 10),
        reportFile: sourcePath ?? undefined
      },
      geneticConditionStatus: {
        ...(animal.geneticConditionStatus ?? {}),
        ...(parsed.parsedData.geneticConditions ?? {})
      },
      epds:
        parsed.parsedData.genomicEPDs &&
        Object.keys(parsed.parsedData.genomicEPDs).length > 0
          ? { ...animal.epds, ...parsed.parsedData.genomicEPDs }
          : animal.epds
    }

    await updateAnimal(merged)
    alert(`Genomic report linked to ${animal.name}.`)
    setParsed(null)
    setSourcePath(null)
    setLinkedAnimalId('')
    await refresh()
  }

  const animalsWithGenomics = animals.filter((a) => a.genomicData)

  return (
    <div>
      <PageHeader
        title="Genomics"
        subtitle="Upload genomic reports from major US labs (Neogen, Zoetis, Igenity, GeneSeek). Link results to animals in your ranch."
      />

      <div className="p-8 space-y-6">
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-ranch-700" />
              <h2 className="font-semibold">Import Genomic Report</h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Lab Format</label>
                <select
                  className="input"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as LabFormat | 'auto')}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="neogen">Neogen GGP</option>
                  <option value="zoetis">Zoetis Clarifide</option>
                  <option value="igenity">Igenity</option>
                  <option value="geneseek">GeneSeek</option>
                  <option value="generic">Generic CSV (manual mapping)</option>
                </select>
              </div>
              <div className="col-span-2 flex items-end">
                <button className="btn-primary" onClick={openFile}>
                  <FileText size={14} /> Choose File…
                </button>
              </div>
            </div>

            {showMapping && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm text-amber-900 mb-2">
                  Auto-detection failed. Set the lab format manually, or use
                  "Generic CSV" and define a column map below.
                </p>
                <GenericColumnMapEditor
                  columnMap={columnMap}
                  onChange={setColumnMap}
                />
              </div>
            )}

            {parsed && (
              <div className="mt-4 border-t border-ranch-100 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ranch-600 mb-2">
                  Parsed Result
                </h3>
                {parsed.success ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Detected lab:</strong>{' '}
                      <span className="font-mono">{parsed.detectedLab}</span>
                    </div>
                    <div>
                      <strong>Animals found:</strong> {parsed.animalsFound}
                    </div>
                    {parsed.name && (
                      <div>
                        <strong>Name on report:</strong> {parsed.name}
                      </div>
                    )}
                    {parsed.registrationNumber && (
                      <div>
                        <strong>Registration #:</strong> {parsed.registrationNumber}
                      </div>
                    )}
                    <div>
                      <strong>Traits extracted:</strong>{' '}
                      <span className="font-mono text-xs">
                        {parsed.traitsExtracted.join(', ') || '—'}
                      </span>
                    </div>

                    {parsed.parsedData?.geneticConditions &&
                      Object.keys(parsed.parsedData.geneticConditions).length > 0 && (
                        <div>
                          <strong>Genetic conditions:</strong>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(
                              parsed.parsedData.geneticConditions
                            ).map(([code, status]) => (
                              <GeneticConditionBadge
                                key={code}
                                code={code}
                                status={status}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                    {parsed.parsedData?.breedComposition &&
                      Object.keys(parsed.parsedData.breedComposition).length > 0 && (
                        <div>
                          <strong>Breed composition:</strong>
                          <div className="font-mono text-xs">
                            {Object.entries(parsed.parsedData.breedComposition)
                              .map(([k, v]) => `${k}: ${v}%`)
                              .join(' · ')}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center gap-2 pt-3 border-t border-ranch-100">
                      <label className="text-sm font-medium">Link to animal:</label>
                      <select
                        className="input flex-1"
                        value={linkedAnimalId}
                        onChange={(e) =>
                          setLinkedAnimalId(
                            e.target.value ? Number(e.target.value) : ''
                          )
                        }
                      >
                        <option value="">Select an animal…</option>
                        {animals.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} — {getBreedConfig(a.breedId)?.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-primary"
                        disabled={!linkedAnimalId}
                        onClick={linkToAnimal}
                      >
                        <LinkIcon size={14} /> Link
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-wagyu-800">
                    <div>Parse failed.</div>
                    <ul className="list-disc list-inside">
                      {parsed.errors?.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Dna size={18} className="text-ranch-700" />
              <h2 className="font-semibold">Animals with Genomic Data</h2>
            </div>
            <span className="text-sm text-ranch-500">
              {animalsWithGenomics.length} animals
            </span>
          </div>
          <div className="card-body p-0">
            {animalsWithGenomics.length === 0 ? (
              <div className="p-6 text-sm text-ranch-600">
                No animals have genomic data linked yet.
              </div>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Animal</th>
                    <th>Lab</th>
                    <th>Panel</th>
                    <th>Conditions</th>
                  </tr>
                </thead>
                <tbody>
                  {animalsWithGenomics.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.name}</td>
                      <td>{a.genomicData?.testingLab ?? '—'}</td>
                      <td className="font-mono text-xs">
                        {a.genomicData?.snpPanelSize
                          ? `${a.genomicData.snpPanelSize.toLocaleString()} SNPs`
                          : '—'}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(a.geneticConditionStatus ?? {}).map(
                            ([code, status]) => (
                              <GeneticConditionBadge
                                key={code}
                                code={code}
                                status={status}
                              />
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function GenericColumnMapEditor({
  columnMap,
  onChange
}: {
  columnMap: Record<string, string>
  onChange: (m: Record<string, string>) => void
}) {
  const entries = Object.entries(columnMap)
  return (
    <div className="space-y-2">
      {entries.map(([csvHeader, field], i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="CSV column name"
            value={csvHeader}
            onChange={(e) => {
              const next = { ...columnMap }
              delete next[csvHeader]
              next[e.target.value] = field
              onChange(next)
            }}
          />
          <input
            className="input flex-1"
            placeholder="App field (e.g. Marb, BW, F11)"
            value={field}
            onChange={(e) =>
              onChange({ ...columnMap, [csvHeader]: e.target.value })
            }
          />
        </div>
      ))}
      <button
        className="btn-secondary"
        onClick={() => onChange({ ...columnMap, ['NewColumn' + entries.length]: '' })}
      >
        Add Mapping
      </button>
    </div>
  )
}
