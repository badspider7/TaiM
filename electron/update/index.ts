import fs from 'node:fs'
import path from 'node:path'
import { type BrowserWindow, app, ipcMain } from 'electron'
import updaterPackage from 'electron-updater'
import { getConfig } from '../config'
import logger from '../logger'
import { UpdateService } from './UpdateService'

export function setupUpdates(win: BrowserWindow, beforeInstall: () => void, installFailed: () => void) {
  const packaged = app.isPackaged && process.platform === 'win32'
  const configured = packaged && fs.existsSync(path.join(process.resourcesPath, 'app-update.yml'))
  const client = configured ? updaterPackage.autoUpdater : undefined
  if (client)
    client.logger = logger
  const service = new UpdateService(client, {
    currentVersion: app.getVersion(),
    disabledReason: packaged ? '安装包缺少更新配置，请从发布页面获取完整安装包' : '开发模式不下载和安装更新，请使用 Windows 安装版',
    beforeInstall,
    installFailed,
    notify: (state) => {
      if (!win.isDestroyed())
        win.webContents.send('updater:state', state)
    },
    logError: error => logger.error('自动更新失败', error),
  })
  ipcMain.handle('updater:get', () => service.snapshot())
  ipcMain.handle('updater:check', () => service.check())
  ipcMain.handle('updater:download', () => service.download())
  ipcMain.handle('updater:install', () => service.install())
  // The preference is read when the timer fires so an immediate settings change is respected.
  const timer = setTimeout(() => {
    if (getConfig().common.autoCheckUpdates)
      void service.check()
  }, 10000)
  timer.unref()
  app.once('before-quit', () => clearTimeout(timer))
  return service
}
