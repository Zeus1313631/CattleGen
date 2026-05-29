import type { BreedConfig } from '../types'

import wagyuBlackAwa from './wagyu_black_awa.json'
import wagyuAu from './wagyu_au.json'
import wagyuRedAkaushi from './wagyu_red_akaushi.json'
import angus from './angus.json'
import hereford from './hereford.json'
import simmental from './simmental.json'
import redAngus from './red_angus.json'
import limousin from './limousin.json'
import brahman from './brahman.json'
import beefmaster from './beefmaster.json'

export const BREED_CONFIGS: BreedConfig[] = [
  wagyuBlackAwa as BreedConfig,
  wagyuAu as BreedConfig,
  wagyuRedAkaushi as BreedConfig,
  angus as BreedConfig,
  hereford as BreedConfig,
  simmental as BreedConfig,
  redAngus as BreedConfig,
  limousin as BreedConfig,
  brahman as BreedConfig,
  beefmaster as BreedConfig
]

export const BREED_MAP: Record<string, BreedConfig> = Object.fromEntries(
  BREED_CONFIGS.map((b) => [b.id, b])
)

export function getBreedConfig(id: string | undefined): BreedConfig | undefined {
  if (!id) return undefined
  return BREED_MAP[id]
}

export function getBreedConfigs(): BreedConfig[] {
  return BREED_CONFIGS
}
