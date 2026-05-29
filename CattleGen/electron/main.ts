import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { initializeDatabase, getDb } from './db'

const isDev = !app.isPackaged

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'CattleGen',
    backgroundColor: '#faf7f2',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initializeDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function registerIpcHandlers(): void {
  // Generic DB-call bridge — keeps the renderer insulated from the native module.
  ipcMain.handle('db:run', (_evt, sql: string, params?: unknown[]) => {
    const db = getDb()
    const stmt = db.prepare(sql)
    return stmt.run(...(params ?? []))
  })

  ipcMain.handle('db:all', (_evt, sql: string, params?: unknown[]) => {
    const db = getDb()
    const stmt = db.prepare(sql)
    return stmt.all(...(params ?? []))
  })

  ipcMain.handle('db:get', (_evt, sql: string, params?: unknown[]) => {
    const db = getDb()
    const stmt = db.prepare(sql)
    return stmt.get(...(params ?? []))
  })

  ipcMain.handle('dialog:openFile', async (_evt, options) => {
    const res = await dialog.showOpenDialog(options ?? {})
    return res
  })

  ipcMain.handle('dialog:saveFile', async (_evt, options) => {
    const res = await dialog.showSaveDialog(options ?? {})
    return res
  })

  ipcMain.handle('file:readText', (_evt, path: string) => {
    return readFileSync(path, 'utf-8')
  })

  ipcMain.handle('shell:openExternal', (_evt, url: string) => {
    return shell.openExternal(url)
  })

  ipcMain.handle('shell:openPath', (_evt, path: string) => {
    return shell.openPath(path)
  })
}
