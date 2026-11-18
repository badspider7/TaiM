import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { app, dialog } from 'electron'
import { BrowserTracking, browserTracking, normalizeWebUrl } from '../electron/browser/tracking.ts'
import { getDB } from '../electron/db/better-sqlite3.ts'
import { validateBackup } from '../electron/db/backup.ts'
import { TimeTracker } from '../electron/utils/timeTracker.ts'

export async function testWebsites(test, { temporary, win, invoke, js, waitText }) {
  const db = getDB()
  let now = new Date(2026, 10, 18, 10).getTime()
  const tracker = new BrowserTracking(() => now)
  let sequence = 0
  let token
  const sample = { client: 'chrome-profile-1', browser: 'chrome', focused: true, url: 'https://example.test/a?lesson=1#section', title: 'Page A' }
  const origin = `chrome-extension://${'a'.repeat(32)}`
  const total = url => db.prepare('SELECT COALESCE(SUM(time), 0) AS time FROM WebsiteHours WHERE url = ?').get(url).time
  const send = async (value = sample, headers = {}) => fetch(`http://127.0.0.1:${tracker.status().port}/v1/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': origin, 'Authorization': `Bearer ${token}`, ...headers },
    body: JSON.stringify({ ...value, sequence: sequence++ }),
  })
  try {
    await test('Website bridge rejects web origins, unauthenticated requests and invalid URLs', async () => {
      await tracker.setEnabled(true, 0)
      token = JSON.parse(await fs.readFile(path.join(temporary, 'browser-tracking.json'), 'utf8')).token
      assert.equal((await send(sample, { Origin: 'https://example.test' })).status, 403)
      assert.equal((await send(sample, { Authorization: 'Bearer wrong' })).status, 401)
      assert.equal((await send({ ...sample, url: 'javascript:alert(1)' })).status, 400)
      assert.equal((await send({ ...sample, title: 'a'.repeat(513) })).status, 400)
      assert.deepEqual(normalizeWebUrl('https://user:pass@example.test/a?q=1#part'), { url: 'https://example.test/a?q=1', domain: 'example.test' })
      assert.equal((await send()).status, 204)
      assert.equal(tracker.status().connected, true)
      assert.equal('token' in tracker.status(), false)
    })
    await test('Website time follows foreground browser, URL switches and heartbeat expiry without duplicate totals', async () => {
      tracker.observe('C:\\Apps\\chrome.exe', 'Page A - Google Chrome')
      now += 1000
      tracker.checkpoint()
      tracker.checkpoint()
      tracker.flush()
      assert.equal(total('https://example.test/a?lesson=1'), 1)
      now += 1000
      const b = { ...sample, url: 'https://example.test/b', title: 'Page B' }
      await send(b)
      tracker.observe('C:\\Apps\\chrome.exe', 'Page B - Google Chrome')
      now += 2000
      tracker.checkpoint()
      now += 4000
      tracker.checkpoint()
      tracker.flush()
      assert.equal(total('https://example.test/a?lesson=1'), 2)
      assert.equal(total('https://example.test/b'), 2.5)
      await send(b)
      tracker.observe('C:\\Apps\\chrome.exe', 'Page B - Google Chrome')
      now += 500
      await send(b)
      now += 500
      tracker.checkpoint()
      tracker.flush()
      assert.equal(total('https://example.test/b'), 3.5)
      const applicationTotal = db.prepare('SELECT SUM(totalTime) AS time FROM AppModels').get().time
      tracker.observe('C:\\Apps\\editor.exe', 'Page B')
      now += 1000
      tracker.checkpoint()
      tracker.observe('C:\\Apps\\msedge.exe', 'Page B - Microsoft Edge')
      now += 1000
      tracker.checkpoint()
      tracker.observe('C:\\Apps\\chrome.exe', 'A different window - Google Chrome')
      now += 1000
      tracker.checkpoint()
      tracker.flush()
      assert.equal(total('https://example.test/b'), 3.5)
      assert.equal(db.prepare('SELECT SUM(totalTime) AS time FROM AppModels').get().time, applicationTotal)
    })
    await test('Website focus loss, pause, delayed polls and midnight splitting preserve observed time only', async () => {
      const midnight = { ...sample, url: 'https://midnight.test/', title: 'Midnight' }
      now = new Date(2026, 10, 18, 23, 59, 59).getTime()
      await send(midnight)
      tracker.observe('C:\\Apps\\chrome.exe', 'Midnight - Google Chrome')
      now += 2000
      tracker.checkpoint()
      tracker.flush()
      assert.deepEqual(db.prepare('SELECT hoursTime, time FROM WebsiteHours WHERE domain = ? ORDER BY hoursTime').all('midnight.test'), [
        { hoursTime: '2026-11-18 23:00:00', time: 1 },
        { hoursTime: '2026-11-19 00:00:00', time: 1 },
      ])
      await send({ ...midnight, focused: false, url: '' })
      tracker.observe('C:\\Apps\\chrome.exe', 'Midnight - Google Chrome')
      now += 1000
      tracker.checkpoint()
      await send(midnight)
      tracker.observe('C:\\Apps\\chrome.exe', 'Midnight - Google Chrome')
      tracker.pause()
      now += 1000
      tracker.checkpoint()
      await send(midnight)
      tracker.observe('C:\\Apps\\chrome.exe', 'Midnight - Google Chrome')
      now += 600000
      tracker.checkpoint()
      tracker.flush()
      assert.equal(total('https://midnight.test/'), 2)
      assert.equal(tracker.status().connected, false)
    })
    await test('Heartbeats cannot keep counting after OS foreground observations stop', async () => {
      const stalled = { ...sample, url: 'https://stalled.test/', title: 'Stalled' }
      await send(stalled)
      tracker.observe('C:\\Apps\\chrome.exe', 'Stalled - Google Chrome')
      for (let i = 0; i < 6; i++) {
        now += 1000
        await send(stalled)
      }
      tracker.checkpoint()
      tracker.flush()
      assert.equal(total('https://stalled.test/'), 2.5)
    })
    await test('Exported extension has local pairing configuration and samples active tabs without private pages', async () => {
      const previousAppPath = app.getAppPath()
      let folder
      app.setAppPath(path.resolve('.'))
      try {
        folder = await tracker.exportExtension()
      }
      finally { app.setAppPath(previousAppPath) }
      const manifest = JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8'))
      assert.equal(manifest.incognito, 'not_allowed')
      assert.deepEqual(manifest.host_permissions, ['http://127.0.0.1:17384/*'])
      assert.equal(manifest.permissions.includes('history'), false)
      const source = await fs.readFile(path.join(folder, 'background.js'), 'utf8')
      const reports = []
      let interval
      let window = { focused: true, incognito: false, tabs: [{ active: true, url: 'https://extension.test/', title: 'Active' }, { active: false, url: 'https://background.test/' }] }
      const event = { addListener() {} }
      const fakeFetch = async (_url, options) => {
        reports.push(JSON.parse(options.body))
        return { ok: true }
      }
      const fakeInterval = (fn) => {
        interval = fn
      }
      const sandbox = { crypto: { randomUUID: () => 'test-worker' }, navigator: { userAgent: 'Test Edg/140' }, AbortSignal, importScripts() {}, setInterval: fakeInterval, TAIM_CONNECTION: { port: 17384, token }, fetch: fakeFetch, chrome: { windows: { getLastFocused: async () => window, onFocusChanged: event }, tabs: { onActivated: event, onUpdated: event, onRemoved: event }, alarms: { create: async () => {}, onAlarm: event }, runtime: { onStartup: event, onInstalled: event }, action: { setBadgeText: async () => {}, setTitle: async () => {} } } }
      vm.runInNewContext(source, sandbox)
      const settle = () => new Promise(resolve => setImmediate(resolve))
      await settle()
      assert.equal(reports[0].url, 'https://extension.test/')
      assert.equal(reports[0].browser, 'edge')
      for (const changes of [{ focused: false }, { incognito: true }, { tabs: [{ active: true, url: 'chrome://settings', title: 'Settings' }] }]) {
        window = { focused: true, incognito: false, tabs: [{ active: true, url: 'https://extension.test/', title: 'Active' }], ...changes }
        interval()
        await settle()
        assert.equal(reports.at(-1).focused, false)
        assert.equal(reports.at(-1).url, '')
      }
    })
  }
  finally {
    tracker.pause()
    tracker.flush()
    await tracker.setEnabled(false)
  }
  await test('Native tracker gates website timing on idle, sleep and ignored applications', async () => {
    await browserTracking.setEnabled(true, 0)
    let clock = Date.now()
    let idle = 0
    const info = { title: 'Native fixture - Google Chrome', owner: { name: 'Chrome', path: 'C:\\Apps\\chrome.exe' } }
    browserTracking.accept({ ...sample, client: 'native-test', sequence: 0, url: 'https://native.test/', title: 'Native fixture' })
    const native = new TimeTracker(async () => info, () => idle, () => clock)
    try {
      native.start()
      await new Promise(resolve => setTimeout(resolve, 50))
      clock += 1000
      native.checkpoint()
      idle = 600
      await native.poll()
      clock += 500
      native.checkpoint()
      idle = 0
      await native.poll()
      native.sleep()
      clock += 500
      native.checkpoint()
      native.wake()
      await native.poll()
      clock += 200
      native.checkpoint()
      info.owner.name = 'Ignored'
      await native.poll()
      clock += 100
      native.checkpoint()
      browserTracking.flush()
      assert.equal(total('https://native.test/'), 1.2)
    }
    finally {
      native.clearAll()
      await browserTracking.setEnabled(false)
    }
  })
  await test('Website page queries domain and URL groups, validates dates and exports safe CSV', async () => {
    const byDomain = await invoke('websites:range', '2026-11-18', '2026-11-18', 'domain')
    assert.equal(byDomain.find(r => r.domain === 'example.test').time, 5.5)
    assert.equal(byDomain.find(r => r.domain === 'example.test').title, 'Page B')
    assert.equal(byDomain.find(r => r.domain === 'example.test').pageCount, 2)
    assert.equal((await invoke('websites:range', '2026-11-18', '2026-11-18', 'url')).filter(r => r.domain === 'example.test').length, 2)
    await assert.rejects(() => invoke('websites:range', '2026-02-30', '2026-11-18', 'url'))
    await assert.rejects(() => invoke('websites:range', '2026-11-18', '2026-11-18', 'invalid'))
    await js('location.hash = \'#/websites\'')
    await waitText('网站停留时间')
    await js('document.querySelector(\'[aria-label="网站开始日期"]\').value = \'2026-11-18\'; document.querySelector(\'[aria-label="网站开始日期"]\').dispatchEvent(new Event(\'input\', { bubbles: true })); document.querySelector(\'[aria-label="网站结束日期"]\').value = \'2026-11-18\'; document.querySelector(\'[aria-label="网站结束日期"]\').dispatchEvent(new Event(\'input\', { bubbles: true }))')
    await js('[...document.querySelectorAll(\'button\')].find(b => b.textContent.trim() === \'查询 / 刷新\').click()')
    await waitText('example.test')
    await js('document.querySelector(\'[aria-label="网站汇总方式"]\').value = \'url\'; document.querySelector(\'[aria-label="网站汇总方式"]\').dispatchEvent(new Event(\'change\', { bubbles: true }))')
    await waitText('https://example.test/a?lesson=1')
    await fs.writeFile(path.join(temporary, 'websites.png'), (await win.webContents.capturePage()).toPNG())
    const exportPath = path.join(temporary, 'websites.csv')
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: exportPath })
    await invoke('websites:export', '2026-11-18', '2026-11-18')
    assert.ok((await fs.readFile(exportPath, 'utf8')).includes('https://example.test/a?lesson=1'))
  })
  await test('Website titles use the latest nonempty hourly title and render remote markup as plain text', async () => {
    const insert = db.prepare('INSERT INTO WebsiteHours(browser, url, domain, title, hoursTime, time) VALUES (?, ?, ?, ?, ?, ?)')
    const title = 'Alpha <img src=x onerror=alert(1)>'
    insert.run('chrome', 'https://titles.test/', 'titles.test', 'Zulu old title', '2026-11-18 10:00:00', 1)
    insert.run('chrome', 'https://titles.test/', 'titles.test', title, '2026-11-18 11:00:00', 1)
    insert.run('chrome', 'https://titles.test/', 'titles.test', '', '2026-11-18 12:00:00', 1)
    const rows = await invoke('websites:range', '2026-11-18', '2026-11-18', 'url')
    assert.equal(rows.find(row => row.domain === 'titles.test').title, title)
    await js('[...document.querySelectorAll(\'button\')].find(b => b.textContent.trim() === \'查询 / 刷新\').click()')
    await waitText(title)
    assert.equal(await js('document.querySelectorAll(\'.website-table img\').length'), 0)
    await js('document.querySelector(\'[aria-label="网站汇总方式"]\').value = \'domain\'; document.querySelector(\'[aria-label="网站汇总方式"]\').dispatchEvent(new Event(\'change\', { bubbles: true }))')
    await waitText('主要页面：Page B')
    await js('[...document.querySelectorAll(\'tr\')].find(row => row.textContent.includes(\'example.test\')).querySelector(\'button\').click()')
    await waitText('https://example.test/a?lesson=1')
    await waitText('example.test · 查看全部网站')
    assert.equal(await js('[...document.querySelectorAll(\'.website-table tbody tr\')].length'), 2)
  })
  await test('Website backup validation supports old backups and rejects unsafe or duplicate website records', () => {
    const backup = { format: 'taim-backup', version: 1, exportedAt: new Date().toISOString(), apps: [], hours: [], categories: [] }
    validateBackup(backup)
    const websites = db.prepare('SELECT * FROM WebsiteHours').all()
    validateBackup({ ...backup, websites })
    assert.throws(() => validateBackup({ ...backup, websites: [websites[0], websites[0]] }))
    assert.throws(() => validateBackup({ ...backup, websites: [{ ...websites[0], url: 'javascript:alert(1)' }] }))
    assert.throws(() => validateBackup({ ...backup, websites: [{ ...websites[0], time: -1 }] }))
    assert.throws(() => validateBackup({ ...backup, websites: [{ ...websites[0], hoursTime: '2026-02-30 10:00:00' }] }))
  })
}
