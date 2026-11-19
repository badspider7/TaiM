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
    const { testUpdates } = await import('./updates.mjs')
    await testUpdates(test, temporary)
    const { releaseHistory } = await import('../electron/const/releaseHistory.ts')
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
    const record = { name: 'Editor', file: 'C:\\Apps\\Editor.exe', iconFile: '', actionDes: 'Test', startTime: '2026-11-17 23:00:00', duration: 30 }
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
    await test('Self usage is rejected and legacy self history is removed without changing other usage', async () => {
      const { isSelfApp } = await import('../electron/utils/selfApp.ts')
      assert.equal(isSelfApp({ name: 'Changed name', path: process.execPath.toUpperCase() }), true)
      assert.equal(isSelfApp({ name: 'Changed name', path: 'C:\\Apps\\other.exe', processId: process.pid }), true)
      assert.equal(isSelfApp({ name: 'Taim!', path: 'C:\\Old\\electron.exe' }), true)
      assert.equal(isSelfApp({ name: 'Changed name', path: 'C:\\Old\\TaiM.exe' }), true)
      assert.equal(isSelfApp({ name: 'TaiM notes', path: 'C:\\Apps\\notes.exe' }), false)
      write({ ...record, name: 'TaiM', file: 'C:\\TaiM\\TaiM.exe' })
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM AppModels').get().n, 1)
      const id = db.prepare('INSERT INTO AppModels(name, file, totalTime) VALUES (\'Taim!\', \'C:\\Old\\TaiM.exe\', 50)').run().lastInsertRowid
      db.prepare('INSERT INTO HoursLogModels(appModelId, hoursTime, time) VALUES (?, ?, 50)').run(id, record.startTime)
      db.prepare('INSERT INTO DailyLogModels(appModelId, dayTime, time) VALUES (?, ?, 50)').run(id, '2026-11-17 00:00:00')
      initDb()
      assert.equal(db.prepare('SELECT * FROM AppModels WHERE id = ?').get(id), undefined)
      assert.equal(db.prepare('SELECT * FROM HoursLogModels WHERE appModelId = ?').get(id), undefined)
      assert.equal(db.prepare('SELECT * FROM DailyLogModels WHERE appModelId = ?').get(id), undefined)
      assert.equal(db.prepare('SELECT totalTime FROM AppModels').get().totalTime, 60)
    })
    await test('Large application icons replace existing low-resolution saved icons', async () => {
      const { getApplicationIcon } = await import('../electron/utils/appIcons.ts')
      const { nativeImage } = await import('electron')
      const icon = await getApplicationIcon(process.execPath)
      assert.ok(nativeImage.createFromDataURL(icon).getSize().width >= 32)
      const rollback = new Error('rollback icon fixture')
      assert.throws(() => db.transaction(() => {
        write({ ...record, duration: 1, iconFile: icon })
        assert.equal(db.prepare('SELECT iconFile FROM AppModels').get().iconFile, icon)
        throw rollback
      })(), error => error === rollback)
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
      const info = { title: 'Test', owner: { name: 'Tracker', path: 'C:\\Apps\\Tracker.exe' } }
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
      const self = new TimeTracker(async () => ({ ...info, owner: { name: 'TaiM', path: process.execPath, processId: process.pid } }), () => 0, () => now)
      self.start()
      await pause(50)
      now += 1000
      self.clearAll()
      assert.equal(db.prepare('SELECT * FROM AppModels WHERE name = \'TaiM\'').get(), undefined)
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
    const { setupWebsites } = await import('../electron/handle/handleWebsites.ts')
    setupWebsites(win)
    handleUsageData()
    const { setupUpdates } = await import('../electron/update/index.ts')
    const updateService = setupUpdates(win, () => {}, () => {})
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
      await waitText('使用时长排行')
      for (let i = 0; i < 60 && !await js('document.documentElement.classList.contains(\'dark\')'); i++) await pause(50)
      assert.equal(await js('document.documentElement.classList.contains(\'dark\')'), true, JSON.stringify({ errors, body: await js('document.body.innerText'), settings: await invoke('settings:get') }))
      assert.equal(await js('typeof window.require'), 'undefined')
      assert.equal(await js('(() => { try { window.ipcRenderer.invoke(\'unapproved-channel\'); return false } catch { return true } })()'), true)
    })
    await test('Overview duration cards show seconds, minutes and hours with minutes at their boundaries', async () => {
      const { Time, formatDate } = await import('../src/utils/timerEvent.ts')
      for (const [seconds, expected] of [[0, '0秒'], [59.9, '59秒'], [60, '1分钟'], [1872, '31分钟'], [3599.9, '59分钟'], [3600, '1小时'], [3660, '1小时1分钟']])
        assert.equal(Time.toString(seconds, true), expected)
      const today = formatDate(new Date())
      const existing = await invoke('usageData:day', today)
      const existingTime = existing.reduce((total, row) => total + row.time, 0)
      write({ ...record, startTime: today, duration: 1872 - existingTime })
      await js('window.dispatchEvent(new Event(\'focus\'))')
      await waitText('31分钟')
      const cards = await js('Array.from(document.querySelectorAll(\'.overview-cards .time\'), node => node.textContent.trim())')
      assert.equal(cards[0], '31分钟')
      assert.equal(cards[2], '31分钟')
    })
    await test('Overview ranking adapts icon tiles and usage bars to both themes', async () => {
      const readRow = () => js(`(() => {
        const row = document.querySelector('.usage-app-row');
        const icon = row.querySelector('.usage-app-icon');
        const bar = row.querySelector('.usage-app-progress');
        const indicator = bar.firstElementChild;
        return {
          href: row.getAttribute('href'),
          icon: getComputedStyle(icon).backgroundColor,
          track: getComputedStyle(bar).backgroundColor,
          indicator: getComputedStyle(indicator).backgroundColor,
        };
      })()`)
      const dark = await readRow()
      try {
        await js('document.documentElement.classList.remove(\'dark\')')
        const light = await readRow()
        assert.match(dark.href, /^#\/detail\?app=\d+$/)
        for (const element of ['icon', 'track', 'indicator'])
          assert.notEqual(dark[element], light[element], element)
        assert.notEqual(dark.track, dark.indicator)
      }
      finally {
        await js('document.documentElement.classList.add(\'dark\')')
      }
      await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
      await fs.writeFile(path.join(temporary, 'overview.png'), (await win.webContents.capturePage()).toPNG())
    })
    await test('Category creation, assignment, rename and deletion through IPC', async () => {
      await invoke('categories:save', null, '开发')
      const [category] = await invoke('categories:list')
      const model = (await invoke('getAppInfo')).find(app => app.file === record.file)
      assert.ok(model)
      await invoke('apps:update', model.id, '代码编辑器', category.id)
      assert.equal((await invoke('getAppInfo')).find(app => app.id === model.id).alias, '代码编辑器')
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
      await js('[...document.querySelectorAll(\'button\')].find(button => button.textContent.trim() === \'近 7 天\').click()')
      const [first, last] = await js('[...document.querySelectorAll(\'input[type=date]\')].map(input => input.value)')
      assert.equal(Date.parse(last) - Date.parse(first), 6 * 86400000)
      await waitText(`${first} 至 ${last}`)
      await js('location.hash = \'#/statistics\'')
      await waitText('累计使用时间')
      await waitText('查看时段明细')
      const { chooseSelect } = await import('./ui-select.mjs')
      await chooseSelect(js, '选择时段查看应用明细', '00:00')
      await waitText('返回使用时长排行')
      await js('[...document.querySelectorAll(\'button\')].find(button => button.textContent.trim() === \'返回使用时长排行\').click()')
      await waitText('使用时长排行')
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
    await test('Main pages fit a narrow window while keeping their navigation and filters visible', async () => {
      const [width, height] = win.getSize()
      win.setSize(690, 620)
      const pages = [
        ['/', '概览', 'overview'],
        ['/statistics', '统计', 'statistics'],
        ['/detail', '应用详情', 'applications'],
        ['/category', '分类', 'categories'],
        ['/websites', '网站停留时间', 'websites'],
        ['/setting', '设置', 'settings'],
      ]
      try {
        for (let attempt = 0; attempt < 60 && !await js('innerWidth < 760'); attempt++)
          await pause(25)
        assert.equal(await js('innerWidth < 760'), true)
        for (const [route, heading, screenshot] of pages) {
          await js(`location.hash = ${JSON.stringify(`#${route}`)}`)
          for (let attempt = 0; attempt < 60 && !await js(`document.querySelector('main h1')?.textContent === ${JSON.stringify(heading)}`); attempt++)
            await pause(25)
          assert.equal(await js('document.querySelector(\'main h1\')?.textContent'), heading)
          await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
          assert.equal(await js('document.querySelector(\'main\').scrollWidth <= document.querySelector(\'main\').clientWidth + 1'), true, route)
          await fs.writeFile(path.join(temporary, `compact-${screenshot}.png`), (await win.webContents.capturePage()).toPNG())
        }
      }
      finally {
        win.setSize(width, height)
      }
    })
    await test('About page shows only the latest offline release and disables development updates', async () => {
      await js('location.hash = \'#/setting?tab=about\'')
      await waitText('更新日志')
      await waitText('开发模式不下载和安装更新')
      await waitText(releaseHistory[0].title)
      for (const entry of releaseHistory.slice(1))
        assert.equal(await js(`document.body.innerText.includes(${JSON.stringify(entry.title)})`), false)
      assert.equal(await js('[...document.querySelectorAll(\'button\')].find(b => b.textContent.trim() === \'检查更新\').disabled'), true)
      await pause(100)
      await fs.writeFile(path.join(temporary, 'updates.png'), (await win.webContents.capturePage()).toPNG())
    })
    await test('Download completion shows an actionable global toast and latest release notes', async () => {
      const original = await invoke('updater:get')
      const available = { ...original, revision: 100, enabled: true, phase: 'available', availableVersion: '0.0.2-beta.1', releaseNotes: '<img src=x onerror=alert(1)>修复记录', message: '发现新版本 0.0.2-beta.1' }
      win.webContents.send('updater:state', available)
      await waitText('修复记录')
      assert.equal(await js('document.querySelectorAll(\'.release-notes img\').length'), 0)
      assert.equal(await js(`document.body.innerText.includes(${JSON.stringify(releaseHistory[0].title)})`), false)
      win.webContents.send('updater:state', { ...available, revision: 101, phase: 'downloading', percent: 25, transferred: 250, total: 1000, message: '正在下载更新，可继续使用 TaiM' })
      await waitText('25.0%')
      assert.equal(await js('document.querySelector(\'.update-notice button\')'), null)
      await js('location.hash = \'#/\'')
      await waitText('使用时长排行')
      const ready = { ...available, revision: 102, phase: 'downloaded', percent: 100, message: '更新已准备就绪' }
      win.webContents.send('updater:state', ready)
      await waitText('重启并安装')
      const install = updateService.install
      updateService.install = () => ({ ...ready, revision: 103, phase: 'error', failedStage: 'install', message: '安装测试失败' })
      try {
        await js('Array.from(document.querySelectorAll(\'.update-notice button\')).find(button => button.textContent.trim() === \'重启并安装\').click()')
        await waitText('安装测试失败')
        win.webContents.send('updater:state', { ...ready, revision: 104 })
        await waitText('重启并安装')
        await js('Array.from(document.querySelectorAll(\'.update-notice button\')).find(button => button.textContent.trim() === \'稍后\').click()')
        assert.equal(await js('document.querySelector(\'.update-notice button\')'), null)
        await js('location.hash = \'#/setting?tab=about\'')
        await waitText('重启并安装')
      }
      finally {
        updateService.install = install
        win.webContents.send('updater:state', { ...original, revision: 105 })
      }
    })
    const { testSelects } = await import('./ui-select.mjs')
    await testSelects(test, { win, js, invoke, waitText, temporary, appFixture: record })
    const { testWebsites } = await import('./websites.mjs')
    await testWebsites(test, { temporary, win, invoke, js, waitText })
    const exportPath = path.join(temporary, 'backup.json')
    await test('JSON and CSV export, backup validation, canceled import and confirmed restore', async () => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: exportPath })
      await invoke('data:export', 'json')
      const backup = JSON.parse(await fs.readFile(exportPath, 'utf8'))
      validateBackup(backup)
      assert.ok(backup.websites.length > 0)
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
      assert.deepEqual(db.prepare('SELECT * FROM WebsiteHours ORDER BY browser, url, hoursTime').all(), [...backup.websites].sort((a, b) => a.browser.localeCompare(b.browser) || a.url.localeCompare(b.url) || a.hoursTime.localeCompare(b.hoursTime)))
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path.join(temporary, 'export.csv') })
      await invoke('data:export', 'csv')
      assert.ok((await fs.readFile(path.join(temporary, 'export.csv'), 'utf8')).includes('代码编辑器'))
      assert.equal(csvCell('=1+1'), '"\'=1+1"')
    })
    await test('Clearing website history requires confirmation and preserves application usage', async () => {
      const total = db.prepare('SELECT SUM(totalTime) AS n FROM AppModels').get().n
      const before = db.prepare('SELECT COUNT(*) AS n FROM WebsiteHours').get().n
      assert.ok(before > 0)
      dialog.showMessageBox = async () => ({ response: 0 })
      assert.equal((await invoke('websites:clear')).canceled, true)
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WebsiteHours').get().n, before)
      dialog.showMessageBox = async () => ({ response: 1 })
      assert.equal((await invoke('websites:clear')).cleared, true)
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WebsiteHours').get().n, 0)
      assert.equal(db.prepare('SELECT SUM(totalTime) AS n FROM AppModels').get().n, total)
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
