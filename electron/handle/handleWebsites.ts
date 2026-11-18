import fs from 'node:fs/promises'
import { type BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
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
  ipcMain.handle('websites:pair', async () => {
    clipboard.writeText(await browserTracking.pairingCode())
    return { copied: true }
  })
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
    const pages = `WITH pages AS (
      SELECT w.browser, w.url, w.domain, SUM(w.time) AS time,
        COALESCE((SELECT title FROM WebsiteHours latest WHERE latest.browser = w.browser AND latest.url = w.url
          AND latest.hoursTime BETWEEN @start AND @end AND trim(latest.title) != '' ORDER BY latest.hoursTime DESC LIMIT 1), '') AS title
      FROM WebsiteHours w WHERE w.hoursTime BETWEEN @start AND @end GROUP BY w.browser, w.url
    )`
    const query = group === 'url'
      ? 'SELECT *, 1 AS pageCount FROM pages ORDER BY time DESC, url'
      : `SELECT p.browser, '' AS url, p.domain, SUM(p.time) AS time, COUNT(*) AS pageCount,
          (SELECT title FROM pages representative WHERE representative.browser = p.browser AND representative.domain = p.domain
            ORDER BY representative.time DESC, representative.url LIMIT 1) AS title
        FROM pages p GROUP BY p.browser, p.domain ORDER BY time DESC, p.domain`
    return getDB().prepare(`${pages} ${query}`).all({ start: range[0], end: range[1] })
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
