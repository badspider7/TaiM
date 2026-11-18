import fs from 'node:fs/promises'
import path from 'node:path'
import { type BrowserWindow, app, dialog, ipcMain, shell } from 'electron'
import { getConfig, saveConfig } from '../config'
import { getDB } from '../db/better-sqlite3'
import { type Backup, csvCell, validateBackup } from '../db/backup'
import tracker from '../utils/timeTracker'
import { cache } from '../utils/activeAppCache'
import { excludeSelfHistory } from '../db/excludeSelf'
import { refreshApplicationIcons } from '../utils/appIcons'

export function flushUsage() {
  tracker.checkpoint()
  cache.flush(true)
}

export function setupSettings(win: BrowserWindow) {
  const db = getDB()
  ipcMain.handle('settings:get', () => ({ config: getConfig(), autoLaunchAvailable: app.isPackaged && process.platform === 'win32',
  }))
  ipcMain.handle('settings:save', (_event, value) => {
    tracker.sleep()
    try {
      return saveConfig(value)
    }
    finally {
      tracker.wake()
    }
  })
  ipcMain.handle('categories:list', () => db.prepare('SELECT * FROM Categories ORDER BY name').all())
  ipcMain.handle('categories:save', (_event, id: number | null, name: string) => {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 40)
      throw new Error('分类名称需为 1–40 个字符')
    if (id !== null && (!Number.isSafeInteger(id) || id <= 0))
      throw new Error('分类无效')
    if (id === null)
      db.prepare('INSERT INTO Categories(name) VALUES (?)').run(name.trim())
    else db.prepare('UPDATE Categories SET name = ? WHERE id = ?').run(name.trim(), id)
  })
  ipcMain.handle('categories:delete', (_event, id: number) => {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error('分类无效')
    db.transaction(() => {
      db.prepare('UPDATE AppModels SET categoryId = 0 WHERE categoryId = ?').run(id)
      db.prepare('DELETE FROM Categories WHERE id = ?').run(id)
    })()
  })
  ipcMain.handle('apps:update', (_event, id: number, alias: string, categoryId: number) => {
    if (!Number.isSafeInteger(id) || typeof alias !== 'string' || alias.length > 80 || !Number.isSafeInteger(categoryId)
      || (categoryId !== 0 && !db.prepare('SELECT id FROM Categories WHERE id = ?').get(categoryId))) {
      throw new Error('应用信息无效')
    }
    db.prepare('UPDATE AppModels SET alias = ?, categoryId = ? WHERE id = ?').run(alias.trim(), categoryId, id)
  })
  ipcMain.handle('data:export', async (_event, format: string) => {
    if (!['json', 'csv'].includes(format))
      throw new Error('导出格式无效')
    const result = await dialog.showSaveDialog(win, { defaultPath: `TaiM-${new Date().toISOString().slice(0, 10)}.${format}`, filters: [{ name: format.toUpperCase(), extensions: [format] }],
    })
    if (result.canceled || !result.filePath) {
      return { canceled: true,
      }
    }
    flushUsage()
    let content: string
    if (format === 'json') {
      const backup: Backup = { format: 'taim-backup', version: 1, exportedAt: new Date().toISOString(), apps: db.prepare('SELECT * FROM AppModels').all() as Backup['apps'], hours: db.prepare('SELECT * FROM HoursLogModels').all() as Backup['hours'], categories: db.prepare('SELECT * FROM Categories').all() as Backup['categories'],
      }
      content = JSON.stringify(backup, null, 2)
    }
    else {
      const rows = db.prepare(`SELECT h.hoursTime, a.name, a.alias, COALESCE(c.name, '未分类') AS category, h.time FROM HoursLogModels h JOIN AppModels a ON h.appModelId = a.id LEFT JOIN Categories c ON a.categoryId = c.id ORDER BY h.hoursTime, a.name`).all() as Record<string, unknown>[]
      content = `\uFEFF${[['时间', '应用', '别名', '分类', '秒数'], ...rows.map(r => [r.hoursTime, r.name, r.alias, r.category, r.time])].map(row => row.map(csvCell).join(',')).join('\r\n')}`
    }
    await fs.writeFile(result.filePath, content, 'utf8')
    return { path: result.filePath,
    }
  })
  ipcMain.handle('data:import', async () => {
    const result = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'TaiM 备份', extensions: ['json'] }],
    })
    if (result.canceled) {
      return { canceled: true,
      }
    }
    const file = result.filePaths[0]
    if ((await fs.stat(file)).size > 100 * 1024 * 1024)
      throw new Error('备份文件不能超过 100 MB')
    const backup = validateBackup(JSON.parse(await fs.readFile(file, 'utf8')))
    const confirmation = await dialog.showMessageBox(win, { type: 'warning', message: '用备份替换现有统计数据？', detail: `将恢复 ${backup.apps.length} 个应用、${backup.hours.length} 条小时记录。替换前会自动备份当前数据库。`, buttons: ['取消', '恢复备份'], defaultId: 0, cancelId: 0,
    })
    if (confirmation.response !== 1) {
      return { canceled: true,
      }
    }
    tracker.sleep()
    try {
      cache.flush(true)
      const backupPath = path.join(app.getPath('userData'), `before-import-${Date.now()}.sqlite3`)
      await db.backup(backupPath)
      db.transaction(() => {
        db.exec('DELETE FROM DailyLogModels; DELETE FROM HoursLogModels; DELETE FROM AppModels; DELETE FROM Categories;')
        const category = db.prepare('INSERT INTO Categories(id, name) VALUES (?, ?)')
        for (const c of backup.categories) category.run(c.id, c.name)
        const model = db.prepare('INSERT INTO AppModels(id, name, alias, description, file, categoryId, iconFile, totalTime) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
        for (const a of backup.apps) model.run(a.id, a.name, a.alias, a.description, a.file, a.categoryId, a.iconFile)
        const hour = db.prepare('INSERT INTO HoursLogModels(hoursTime, time, appModelId) VALUES (?, ?, ?)')
        for (const h of backup.hours) hour.run(h.hoursTime, h.time, h.appModelId)
        db.exec(`INSERT INTO DailyLogModels(dayTime, time, appModelId) SELECT substr(hoursTime, 1, 10) || ' 00:00:00', SUM(time), appModelId FROM HoursLogModels GROUP BY substr(hoursTime, 1, 10), appModelId;
          UPDATE AppModels SET totalTime = COALESCE((SELECT SUM(time) FROM HoursLogModels WHERE appModelId = AppModels.id), 0);`)
        excludeSelfHistory()
      })()
      await refreshApplicationIcons()
      return { backupPath,
      }
    }
    finally {
      tracker.wake()
    }
  })
  ipcMain.handle('data:folder', () => shell.openPath(app.getPath('userData')))
  ipcMain.handle('app:version', () => app.getVersion())
}
