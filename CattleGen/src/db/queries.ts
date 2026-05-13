/**
 * Renderer-side CRUD helpers. All queries go through the IPC bridge:
 *   window.cattlegen.db.run / .all / .get
 *
 * JSON columns (epds, accuracy, prefectural_composition, genomic_profile,
 * genetic_conditions, predicted_progeny, percentile_rankings, index_values,
 * custom_weights, raw_data) are stored as TEXT and parsed/stringified here.
 */

import type {
  Animal,
  Herd,
  MatingPrediction,
  PublicSireRecord,
  Ranch,
  WagyuSubtype
} from '../types'

const api = () => window.cattlegen.db

function toJson(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

function fromJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback
  if (typeof v !== 'string') return (v as T) ?? fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

// ---------- Ranches ---------------------------------------------------------

interface RanchRow {
  id: number
  name: string
  owner_name: string | null
  location: string | null
  is_my_ranch: number
  notes: string | null
  created_at: string
}

function rowToRanch(row: RanchRow): Ranch {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.owner_name ?? undefined,
    location: row.location ?? undefined,
    isMyRanch: row.is_my_ranch === 1,
    notes: row.notes ?? undefined
  }
}

export async function listRanches(): Promise<Ranch[]> {
  const rows = await api().all<RanchRow>(`SELECT * FROM ranches ORDER BY id`)
  return rows.map(rowToRanch)
}

export async function getMyRanch(): Promise<Ranch | null> {
  const row = await api().get<RanchRow>(
    `SELECT * FROM ranches WHERE is_my_ranch = 1 LIMIT 1`
  )
  return row ? rowToRanch(row) : null
}

export async function upsertMyRanch(ranch: Ranch): Promise<number> {
  const existing = await getMyRanch()
  if (existing?.id) {
    await api().run(
      `UPDATE ranches
         SET name = ?, owner_name = ?, location = ?, is_my_ranch = 1, notes = ?
       WHERE id = ?`,
      [
        ranch.name,
        ranch.ownerName ?? null,
        ranch.location ?? null,
        ranch.notes ?? null,
        existing.id
      ]
    )
    return existing.id
  }
  const res = await api().run(
    `INSERT INTO ranches (name, owner_name, location, is_my_ranch, notes)
     VALUES (?, ?, ?, 1, ?)`,
    [ranch.name, ranch.ownerName ?? null, ranch.location ?? null, ranch.notes ?? null]
  )
  return Number(res.lastInsertRowid)
}

// ---------- Herds -----------------------------------------------------------

interface HerdRow {
  id: number
  ranch_id: number | null
  name: string
  breed_id: string
  notes: string | null
}

function rowToHerd(row: HerdRow): Herd {
  return {
    id: row.id,
    ranchId: row.ranch_id ?? undefined,
    name: row.name,
    breedId: row.breed_id,
    notes: row.notes ?? undefined
  }
}

export async function listHerds(): Promise<Herd[]> {
  const rows = await api().all<HerdRow>(`SELECT * FROM herds ORDER BY name`)
  return rows.map(rowToHerd)
}

export async function createHerd(h: Herd): Promise<number> {
  const res = await api().run(
    `INSERT INTO herds (ranch_id, name, breed_id, notes) VALUES (?, ?, ?, ?)`,
    [h.ranchId ?? null, h.name, h.breedId, h.notes ?? null]
  )
  return Number(res.lastInsertRowid)
}

export async function updateHerd(h: Herd): Promise<void> {
  if (!h.id) throw new Error('Herd id required')
  await api().run(
    `UPDATE herds SET ranch_id = ?, name = ?, breed_id = ?, notes = ? WHERE id = ?`,
    [h.ranchId ?? null, h.name, h.breedId, h.notes ?? null, h.id]
  )
}

export async function deleteHerd(id: number): Promise<void> {
  await api().run(`DELETE FROM herds WHERE id = ?`, [id])
}

// ---------- Animals ---------------------------------------------------------

interface AnimalRow {
  id: number
  registration_number: string | null
  name: string
  tattoo: string | null
  breed_id: string
  wagyu_subtype: string | null
  sex: string
  birth_date: string | null
  birth_year: number | null
  sire_id: number | null
  dam_id: number | null
  herd_id: number | null
  is_public_record: number
  source_association: string | null
  epds: string | null
  accuracy: string | null
  prefectural_composition: string | null
  genetic_conditions: string | null
  genomic_profile: string | null
  notes: string | null
  photo_url: string | null
}

function rowToAnimal(row: AnimalRow): Animal {
  return {
    id: row.id,
    registrationNumber: row.registration_number ?? undefined,
    name: row.name,
    tattoo: row.tattoo ?? undefined,
    breedId: row.breed_id,
    wagyuSubtype: (row.wagyu_subtype ?? undefined) as WagyuSubtype | undefined,
    sex: row.sex as Animal['sex'],
    birthDate: row.birth_date ?? undefined,
    birthYear: row.birth_year ?? undefined,
    sireId: row.sire_id ?? undefined,
    damId: row.dam_id ?? undefined,
    herdId: row.herd_id ?? undefined,
    isPublicRecord: row.is_public_record === 1,
    sourceAssociation: row.source_association ?? undefined,
    epds: fromJson(row.epds, {}),
    accuracy: fromJson(row.accuracy, {}),
    prefecturalComposition: fromJson(row.prefectural_composition, undefined as any),
    geneticConditionStatus: fromJson(row.genetic_conditions, {}),
    genomicData: fromJson(row.genomic_profile, undefined as any),
    notes: row.notes ?? undefined,
    photoUrl: row.photo_url ?? undefined
  }
}

export async function listAnimals(opts: {
  breedId?: string
  herdId?: number
  publicOnly?: boolean
} = {}): Promise<Animal[]> {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.breedId) {
    where.push(`breed_id = ?`)
    params.push(opts.breedId)
  }
  if (opts.herdId != null) {
    where.push(`herd_id = ?`)
    params.push(opts.herdId)
  }
  if (opts.publicOnly != null) {
    where.push(`is_public_record = ?`)
    params.push(opts.publicOnly ? 1 : 0)
  }
  const sql = `SELECT * FROM animals ${
    where.length ? 'WHERE ' + where.join(' AND ') : ''
  } ORDER BY name`
  const rows = await api().all<AnimalRow>(sql, params)
  return rows.map(rowToAnimal)
}

export async function getAnimalsByHerd(herdId: number): Promise<Animal[]> {
  return listAnimals({ herdId })
}

export async function getAnimal(id: number): Promise<Animal | null> {
  const row = await api().get<AnimalRow>(`SELECT * FROM animals WHERE id = ?`, [id])
  return row ? rowToAnimal(row) : null
}

export async function createAnimal(a: Animal): Promise<number> {
  const res = await api().run(
    `INSERT INTO animals (
      registration_number, name, tattoo, breed_id, wagyu_subtype, sex,
      birth_date, birth_year, sire_id, dam_id, herd_id,
      is_public_record, source_association,
      epds, accuracy, prefectural_composition, genetic_conditions, genomic_profile,
      notes, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      a.registrationNumber ?? null,
      a.name,
      a.tattoo ?? null,
      a.breedId,
      a.wagyuSubtype ?? null,
      a.sex,
      a.birthDate ?? null,
      a.birthYear ?? null,
      a.sireId ?? null,
      a.damId ?? null,
      a.herdId ?? null,
      a.isPublicRecord ? 1 : 0,
      a.sourceAssociation ?? null,
      toJson(a.epds ?? {}),
      toJson(a.accuracy ?? {}),
      toJson(a.prefecturalComposition),
      toJson(a.geneticConditionStatus ?? {}),
      toJson(a.genomicData),
      a.notes ?? null,
      a.photoUrl ?? null
    ]
  )
  return Number(res.lastInsertRowid)
}

export async function updateAnimal(a: Animal): Promise<void> {
  if (!a.id) throw new Error('Animal id required')
  await api().run(
    `UPDATE animals SET
      registration_number = ?, name = ?, tattoo = ?, breed_id = ?, wagyu_subtype = ?, sex = ?,
      birth_date = ?, birth_year = ?, sire_id = ?, dam_id = ?, herd_id = ?,
      is_public_record = ?, source_association = ?,
      epds = ?, accuracy = ?, prefectural_composition = ?, genetic_conditions = ?, genomic_profile = ?,
      notes = ?, photo_url = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      a.registrationNumber ?? null,
      a.name,
      a.tattoo ?? null,
      a.breedId,
      a.wagyuSubtype ?? null,
      a.sex,
      a.birthDate ?? null,
      a.birthYear ?? null,
      a.sireId ?? null,
      a.damId ?? null,
      a.herdId ?? null,
      a.isPublicRecord ? 1 : 0,
      a.sourceAssociation ?? null,
      toJson(a.epds ?? {}),
      toJson(a.accuracy ?? {}),
      toJson(a.prefecturalComposition),
      toJson(a.geneticConditionStatus ?? {}),
      toJson(a.genomicData),
      a.notes ?? null,
      a.photoUrl ?? null,
      a.id
    ]
  )
}

export async function deleteAnimal(id: number): Promise<void> {
  await api().run(`DELETE FROM animals WHERE id = ?`, [id])
}

// ---------- Public sire cache ----------------------------------------------

interface PublicSireRow {
  id: number
  registration_number: string
  name: string
  breed_id: string
  wagyu_subtype: string | null
  association: string
  source: string
  epds: string | null
  accuracy: string | null
  prefectural_composition: string | null
  birth_year: number | null
  last_updated: string | null
}

function rowToPublicSire(row: PublicSireRow): PublicSireRecord {
  return {
    registrationNumber: row.registration_number,
    name: row.name,
    breedId: row.breed_id,
    wagyuSubtype: (row.wagyu_subtype ?? undefined) as WagyuSubtype | undefined,
    association: row.association,
    dataSource: row.source as PublicSireRecord['dataSource'],
    epds: fromJson(row.epds, {}),
    accuracy: fromJson(row.accuracy, {}),
    prefecturalComposition: fromJson(row.prefectural_composition, undefined as any),
    birthYear: row.birth_year ?? undefined,
    lastUpdated: row.last_updated ?? undefined
  }
}

export async function replacePublicSireCache(
  association: string,
  source: PublicSireRecord['dataSource'],
  records: PublicSireRecord[]
): Promise<number> {
  await api().run(`DELETE FROM public_sire_cache WHERE association = ?`, [association])
  let inserted = 0
  for (const r of records) {
    await api().run(
      `INSERT INTO public_sire_cache (
        registration_number, name, breed_id, wagyu_subtype,
        association, source, epds, accuracy, prefectural_composition,
        birth_year, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.registrationNumber,
        r.name,
        r.breedId,
        r.wagyuSubtype ?? null,
        r.association,
        source,
        toJson(r.epds),
        toJson(r.accuracy ?? {}),
        toJson(r.prefecturalComposition),
        r.birthYear ?? null,
        r.lastUpdated ?? null
      ]
    )
    inserted++
  }
  return inserted
}

export async function searchPublicSires(opts: {
  breedId?: string
  association?: string
  query?: string
  traitFilters?: Array<{ trait: string; min?: number; max?: number }>
  sortTrait?: string
  sortDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}): Promise<PublicSireRecord[]> {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.breedId) {
    where.push(`breed_id = ?`)
    params.push(opts.breedId)
  }
  if (opts.association) {
    where.push(`association = ?`)
    params.push(opts.association)
  }
  if (opts.query) {
    where.push(`(name LIKE ? OR registration_number LIKE ?)`)
    params.push(`%${opts.query}%`, `%${opts.query}%`)
  }
  const sql = `SELECT * FROM public_sire_cache ${
    where.length ? 'WHERE ' + where.join(' AND ') : ''
  } LIMIT ${opts.limit ?? 200} OFFSET ${opts.offset ?? 0}`
  const rows = await api().all<PublicSireRow>(sql, params)
  let out = rows.map(rowToPublicSire)

  if (opts.traitFilters?.length) {
    out = out.filter((r) =>
      opts.traitFilters!.every(({ trait, min, max }) => {
        const v = r.epds[trait]
        if (typeof v !== 'number') return false
        if (min != null && v < min) return false
        if (max != null && v > max) return false
        return true
      })
    )
  }

  if (opts.sortTrait) {
    const dir = opts.sortDir === 'asc' ? 1 : -1
    out.sort((a, b) => {
      const av = a.epds[opts.sortTrait!]
      const bv = b.epds[opts.sortTrait!]
      if (typeof av !== 'number' && typeof bv !== 'number') return 0
      if (typeof av !== 'number') return 1
      if (typeof bv !== 'number') return -1
      return (av - bv) * dir
    })
  }

  return out
}

export async function getTopSiresByTrait(
  breedId: string,
  traitKey: string,
  limit = 10
): Promise<PublicSireRecord[]> {
  return searchPublicSires({
    breedId,
    sortTrait: traitKey,
    sortDir: 'desc',
    limit
  })
}

// ---------- Matings ---------------------------------------------------------

interface MatingRow {
  id: number
  sire_id: number | null
  dam_id: number | null
  breed_id: string
  predicted_progeny: string | null
  percentile_rankings: string | null
  index_values: string | null
  weighted_score: number | null
  custom_weights: string | null
  notes: string | null
  created_at: string
}

export async function saveMating(
  prediction: MatingPrediction
): Promise<number> {
  const res = await api().run(
    `INSERT INTO matings (
      sire_id, dam_id, breed_id,
      predicted_progeny, percentile_rankings, index_values,
      weighted_score, custom_weights, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      prediction.sire.id ?? null,
      prediction.dam.id ?? null,
      prediction.breedConfig.id,
      toJson(prediction.predictedProgeny),
      toJson(prediction.percentileRankings),
      toJson(prediction.indexValues ?? {}),
      prediction.weightedScore ?? null,
      toJson(prediction.customWeights ?? {}),
      prediction.notes ?? null
    ]
  )
  return Number(res.lastInsertRowid)
}

export async function getRecentMatings(limit = 20): Promise<MatingRow[]> {
  return api().all<MatingRow>(
    `SELECT * FROM matings ORDER BY created_at DESC LIMIT ?`,
    [limit]
  )
}

export async function getMatingHistory(animalId: number): Promise<MatingRow[]> {
  return api().all<MatingRow>(
    `SELECT * FROM matings WHERE sire_id = ? OR dam_id = ? ORDER BY created_at DESC`,
    [animalId, animalId]
  )
}

export async function countAll(): Promise<{
  animals: number
  herds: number
  matings: number
}> {
  const a = await api().get<{ n: number }>(`SELECT COUNT(*) as n FROM animals WHERE is_public_record = 0`)
  const h = await api().get<{ n: number }>(`SELECT COUNT(*) as n FROM herds`)
  const m = await api().get<{ n: number }>(`SELECT COUNT(*) as n FROM matings`)
  return {
    animals: a?.n ?? 0,
    herds: h?.n ?? 0,
    matings: m?.n ?? 0
  }
}

// ---------- Settings --------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const row = await api().get<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  )
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await api().run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  )
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await api().all<{ key: string; value: string }>(
    `SELECT key, value FROM settings`
  )
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}
