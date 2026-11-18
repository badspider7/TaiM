import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { BrowserWindow, app, dialog } from 'electron'

const temporary = process.env.TAIM_DATA_DIR
app.disableHardwareAcceleration()
app.setPath('userData', temporary)
const results = []
let win
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
async function test(name, fn) {
  await fn()
  results.push(name)
}

async function run() {
  try {
    await app.whenReady()
    const { initDb } = await import('../electron/db/index.ts')
    const { getDB } = await import('../electron/db/better-sqlite3.ts')
    const { executeMethodsInOrder: write } = await import('../electron/handle/handleFocusWin.ts')
    const { splitInterval } = await import('../electron/utils/usage.ts')
    const { validateBackup, csvCell } = await import('../electron/db/backup.ts')
    const { getConfig, saveConfig } = await import('../electron/config.ts')
    const { activeWindow } = await import('get-windows')
    await test('Windows activity native module loads', async () => {
      await activeWindow()
    })
    const { TimeTracker } = await import('../electron/utils/timeTracker.ts')
    const { cache } = await import('../electron/utils/activeAppCache.ts')
    const db = getDB()
    const record = { name: 'Editor', file: process.execPath, iconFile: '', actionDes: 'Test', startTime: '2026-11-17 23:00:00', duration: 30 }
    await test('Fresh and repeated database initialization', () => {
      initDb()
      initDb()
      assert.ok(db.prepare('SELECT * FROM Categories').all())
    })
    await test('Cross-hour and midnight splitting preserves duration', () => {
      const segments = splitInterval(new Date(2026, 10, 17, 23, 59, 30).getTime(), new Date(2026, 10, 18, 0, 0, 30).getTime())
      assert.deepEqual(segments.map(s => s.duration), [30, 30])
      assert.deepEqual(segments.map(s => s.startTime), ['2026-11-17 23:00:00', '2026-11-18 00:00:00'])
      assert.deepEqual(splitInterval(20, 10), [])
      for (const s of segments) write({ ...record, ...s })
      assert.equal(db.prepare('SELECT totalTime FROM AppModels').get().totalTime, 60)
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM DailyLogModels').get().n, 2)
    })
    await test('Invalid duration ignored and failed writes roll back all totals', () => {
      write({ ...record, duration: -300 })
      db.exec('CREATE TRIGGER fail_hour BEFORE UPDATE ON HoursLogModels BEGIN SELECT RAISE(ABORT, \'test\'); END')
      assert.throws(() => write(record))
      assert.equal(db.prepare('SELECT totalTime FROM AppModels').get().totalTime, 60)
      db.exec('DROP TRIGGER fail_hour')
    })
    await test('Cache retries failed transactions without losing or double counting data', () => {
      cache.add(record)
      db.exec('CREATE TRIGGER fail_hour BEFORE UPDATE ON HoursLogModels BEGIN SELECT RAISE(ABORT, \'test\'); END')
      cache.flush()
      assert.equal(db.prepare('SELECT totalTime FROM AppModels').get().totalTime, 60)
      db.exec('DROP TRIGGER fail_hour')
      cache.flush()
      cache.flush()
      assert.equal(db.prepare('SELECT totalTime FROM AppModels').get().totalTime, 90)
    })
    await test('Settings persist and reject malformed input', async () => {
      const settings = getConfig()
      settings.common.theme = 'dark'
      settings.actions.ignoredApps = ['Ignored']
      saveConfig(settings)
      assert.equal(JSON.parse(await fs.readFile(path.join(temporary, 'settings.json'), 'utf8')).common.theme, 'dark')
      assert.throws(() => saveConfig({ ...settings, actions: { idleMinutes: 0, ignoredApps: [] } }))
    })
    await test('Tracker flushes on stop, never subtracts idle time, and skips long gaps', async () => {
      let now = new Date(2026, 10, 18, 9).getTime()
      const info = { title: 'Test', owner: { name: 'Tracker', path: process.execPath } }
      const tracker = new TimeTracker(async () => info, () => 0, () => now)
      tracker.start()
      await pause(150)
      now += 1500
      tracker.checkpoint()
      now += 600000
      tracker.clearAll()
      assert.equal(db.prepare('SELECT totalTime FROM AppModels WHERE name = \'Tracker\'').get().totalTime, 1.5)
      const idle = new TimeTracker(async () => ({ ...info, owner: { ...info.owner, name: 'Idle' } }), () => 600, () => now)
      idle.start()
      await pause(50)
      now += 1000
      idle.clearAll()
      assert.equal(db.prepare('SELECT * FROM AppModels WHERE name = \'Idle\'').get(), undefined)
      const ignored = new TimeTracker(async () => ({ ...info, owner: { ...info.owner, name: 'Ignored' } }), () => 0, () => now)
      ignored.start()
      await pause(50)
      now += 1000
      ignored.clearAll()
      assert.equal(db.prepare('SELECT * FROM AppModels WHERE name = \'Ignored\'').get(), undefined)
      let resolve
      const pending = new TimeTracker(() => new Promise((r) => {
        resolve = r
      }), () => 0, () => now)
      pending.start()
      pending.clearAll()
      resolve({ ...info, owner: { ...info.owner, name: 'Late' } })
      await pause(50)
      assert.equal(db.prepare('SELECT * FROM AppModels WHERE name = \'Late\'').get(), undefined)
    })
    const { setupSettings } = await import('../electron/handle/handleSettings.ts')
    const { handleUsageData } = await import('../electron/handle/handleUsageData.ts')
    win = new BrowserWindow({ show: false, width: 1100, height: 800, webPreferences: { preload: path.resolve('dist-electron/preload/index.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false, offscreen: true, backgroundThrottling: false } })
    setupSettings(win)
    handleUsageData()
    const errors = []
    win.webContents.on('console-message', (_event, level, message) => {
      if (level === 3) {
        errors.push(message)
        void fs.appendFile(path.join(temporary, 'renderer-errors.log'), `${message}\n`)
      }
    })
    const js = source => win.webContents.executeJavaScript(source)
    const invoke = (channel, ...args) => js(`window.ipcRenderer.invoke(${[channel, ...args].map(a => JSON.stringify(a)).join(',')})`)
    const waitText = async (text) => {
      for (let i = 0; i < 60; i++) {
        if (await js(`document.body.innerText.includes(${JSON.stringify(text)})`))
          return
        await pause(50)
      }
      throw new Error(`UI did not show: ${text}`)
    }
    await win.loadFile(path.resolve('dist/index.html'))
    await test('Built renderer boots with isolated preload and persisted dark theme', async () => {
      await waitText('最为频繁')
      for (let i = 0; i < 60 && !await js('document.documentElement.classList.contains(\'dark\')'); i++) await pause(50)
      assert.equal(await js('document.documentElement.classList.contains(\'dark\')'), true, JSON.stringify({ errors, body: await js('document.body.innerText'), settings: await invoke('settings:get') }))
      assert.equal(await js('typeof window.require'), 'undefined')
      assert.equal(await js('(() => { try { window.ipcRenderer.invoke(\'unapproved-channel\'); return false } catch { return true } })()'), true)
    })
    await test('Category creation, assignment, rename and deletion through IPC', async () => {
      await invoke('categories:save', null, '开发')
      const [category] = await invoke('categories:list')
      const [model] = await invoke('getAppInfo')
      await invoke('apps:update', model.id, '代码编辑器', category.id)
      assert.equal((await invoke('getAppInfo'))[0].alias, '代码编辑器')
      await invoke('categories:save', category.id, '工作')
      assert.equal((await invoke('categories:list'))[0].name, '工作')
      await js('location.hash = \'#/category\'')
      await waitText('应用归类')
      await waitText('代码编辑器')
      await pause(100)
      await fs.writeFile(path.join(temporary, 'category.png'), (await win.webContents.capturePage()).toPNG())
      await invoke('categories:delete', category.id)
      assert.equal((await invoke('getAppInfo'))[0].categoryId, 0)
    })
    await test('Detail, statistics and data settings routes render without runtime errors', async () => {
      await js('location.hash = \'#/detail\'')
      await waitText('查询 / 刷新')
      await js('location.hash = \'#/statistics\'')
      await waitText('累计使用时间')
      for (const tab of ['按周', '按月', '按年', '按天']) {
        await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(tab)}).click()`)
        await pause(200)
        assert.equal(await js('!!document.querySelector(".chart-element canvas")'), true)
      }
      await js('location.hash = \'#/setting\'')
      await waitText('记住窗口大小')
      await js('[...document.querySelectorAll(\'button\')].find(b => b.textContent.trim() === \'数据\').click()')
      await waitText('导出 JSON 备份')
      await pause(100)
      await fs.writeFile(path.join(temporary, 'settings.png'), (await win.webContents.capturePage()).toPNG())
    })
    const exportPath = path.join(temporary, 'backup.json')
    await test('JSON and CSV export, backup validation, canceled import and confirmed restore', async () => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: exportPath })
      await invoke('data:export', 'json')
      const backup = JSON.parse(await fs.readFile(exportPath, 'utf8'))
      validateBackup(backup)
      assert.throws(() => validateBackup({ ...backup, hours: [{ ...backup.hours[0], time: -1 }] }))
      assert.throws(() => validateBackup({ ...backup, hours: [{ ...backup.hours[0], hoursTime: '2026-02-30 12:00:00' }] }))
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [exportPath] })
      dialog.showMessageBox = async () => ({ response: 0 })
      assert.equal((await invoke('data:import')).canceled, true)
      const count = db.prepare('SELECT SUM(time) AS n FROM HoursLogModels').get().n
      write(record)
      dialog.showMessageBox = async () => ({ response: 1 })
      const restored = await invoke('data:import')
      assert.ok((await fs.stat(restored.backupPath)).size > 0)
      assert.equal(db.prepare('SELECT SUM(time) AS n FROM HoursLogModels').get().n, count)
      assert.equal(db.prepare('SELECT SUM(totalTime) AS n FROM AppModels').get().n, count)
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path.join(temporary, 'export.csv') })
      await invoke('data:export', 'csv')
      assert.ok((await fs.readFile(path.join(temporary, 'export.csv'), 'utf8')).includes('代码编辑器'))
      assert.equal(csvCell('=1+1'), '"\'=1+1"')
    })
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(temporary, 'result.json'), JSON.stringify({ passed: results.length, tests: results }, null, 2))
    win.destroy()
    app.exit(0)
  }
  catch (error) {
    await fs.writeFile(path.join(temporary, 'result.json'), JSON.stringify({ passed: results.length, tests: results, error: error.stack }, null, 2))
    win?.destroy()
    app.exit(1)
  }
}
void run()
