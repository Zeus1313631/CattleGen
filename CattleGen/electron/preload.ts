import { contextBridge, ipcRenderer, type OpenDialogOptions, type SaveDialogOptions } from 'electron'

export type DbRunResult = { changes: number; lastInsertRowid: number | bigint }

const api = {
  db: {
    run: (sql: string, params?: unknown[]): Promise<DbRunResult> =>
      ipcRenderer.invoke('db:run', sql, params),
    all: <T = unknown>(sql: string, params?: unknown[]): Promise<T[]> =>
      ipcRenderer.invoke('db:all', sql, params),
    get: <T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> =>
      ipcRenderer.invoke('db:get', sql, params)
  },
  dialog: {
    openFile: (options?: OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options?: SaveDialogOptions) => ipcRenderer.invoke('dialog:saveFile', options)
  },
  file: {
    readText: (path: string): Promise<string> => ipcRenderer.invoke('file:readText', path)
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path: string): Promise<string> => ipcRenderer.invoke('shell:openPath', path)
  }
}

contextBridge.exposeInMainWorld('cattlegen', api)

export type CattleGenAPI = typeof api
