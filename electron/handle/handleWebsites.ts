import fs from 'node:fs/promises'
import { type BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { browserTracking } from '../browser/tracking'
import { getDB } from '../db/better-sqlite3'
import { csvCell } from '../db/backup'
import { flushUsage } from './handleSettings'

function bounds(start: unknown, end: unknown) {
  const valid = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false
    const date = new Date(`${value}T12:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  }
  if (!valid(start) || !valid(end) || start > end)
    throw new Error('请选择有效的起止日期')
  return [`${start} 00:00:00`, `${end} 23:00:00`]
}

export function setupWebsites(win: BrowserWindow) {
  ipcMain.handle('websites:status', () => browserTracking.status())
  let changing = false
  ipcMain.handle('websites:enable', async (_event, enabled: unknown) => {
    if (typeof enabled !== 'boolean' || changing)
      throw new Error('请稍后重试')
    changing = true
    try {
      flushUsage()
      return await browserTracking.setEnabled(enabled)
    }
    finally { changing = false }
  })
  ipcMain.handle('websites:extension', async () => {
    const folder = await browserTracking.exportExtension()
    const error = await shell.openPath(folder)
    if (error)
      throw new Error(error)
    return folder
  })
  ipcMain.handle('websites:range', (_event, start, end, group) => {
    const range = bounds(start, end)
    if (!['url', 'domain'].includes(group))
      throw new Error('分组方式无效')
    flushUsage()
    return getDB().prepare(`SELECT browser, ${group === 'url' ? 'url' : '\'\' AS url'}, domain,
      ${group === 'url' ? 'MAX(title)' : '\'\''} AS title, SUM(time) AS time
      FROM WebsiteHours WHERE hoursTime BETWEEN ? AND ? GROUP BY browser, ${group} ORDER BY time DESC`).all(...range)
  })
  ipcMain.handle('websites:export', async (_event, start, end) => {
    const range = bounds(start, end)
    const result = await dialog.showSaveDialog(win, { defaultPath: `TaiM-websites-${start}-${end}.csv`, filters: [{ name: 'CSV', extensions: ['csv'] }] })
    if (result.canceled || !result.filePath)
      return { canceled: true }
    flushUsage()
    const rows = getDB().prepare('SELECT * FROM WebsiteHours WHERE hoursTime BETWEEN ? AND ? ORDER BY hoursTime, url').all(...range) as Record<string, unknown>[]
    const content = [['时间', '浏览器', '域名', '网址', '标题', '秒数'], ...rows.map(r => [r.hoursTime, r.browser, r.domain, r.url, r.title, r.time])]
    await fs.writeFile(result.filePath, `\uFEFF${content.map(row => row.map(csvCell).join(',')).join('\r\n')}`)
    return { path: result.filePath }
  })
  ipcMain.handle('websites:clear', async () => {
    const result = await dialog.showMessageBox(win, { type: 'warning', message: '清空全部网站记录？', detail: '这会删除所有日期的网站记录，不影响应用统计。可先导出 JSON 备份。', buttons: ['取消', '清空网站记录'], defaultId: 0, cancelId: 0 })
    if (result.response !== 1)
      return { canceled: true }
    browserTracking.clear()
    return { cleared: true }
  })
}
