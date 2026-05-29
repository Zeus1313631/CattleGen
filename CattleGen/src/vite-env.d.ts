/// <reference types="vite/client" />

import type { CattleGenAPI } from '../electron/preload'

declare global {
  interface Window {
    cattlegen: CattleGenAPI
  }
}

export {}
