import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { BrowserWindow, app } from 'electron'

const temporary = process.env.TAIM_DATA_DIR
app.setPath('userData', temporary)
app.disableHardwareAcceleration()
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

async function run() {
  try {
    await import('../dist-electron/main/index.js')
    await app.whenReady()
    let win
    for (let i = 0; i < 100; i++) {
      win = BrowserWindow.getAllWindows()[0]
      if (win && !win.webContents.isLoading())
        break
      await pause(50)
    }
    assert.ok(win)
    const errors = []
    win.webContents.on('console-message', (_event, level, message) => {
      if (level === 3)
        errors.push(message)
    })
    for (let i = 0; i < 60 && !await win.webContents.executeJavaScript('!!window.ipcRenderer'); i++) await pause(50)
    const settings = await win.webContents.executeJavaScript('window.ipcRenderer.invoke(\'settings:get\')')
    assert.equal(settings.autoLaunchAvailable, false)
    const maximized = await win.webContents.executeJavaScript('window.ipcRenderer.invoke(\'titleBarControl:maximizeOrUnmaximize\')')
    assert.equal(maximized, true)
    await win.webContents.executeJavaScript('window.ipcRenderer.invoke(\'titleBarControl:close\', \'hide\')')
    assert.equal(win.isVisible(), false)
    win.close()
    assert.equal(win.isDestroyed(), false)
    await pause(2200)
    app.on('before-quit', () => {
      const require = createRequire(import.meta.url)
      const Database = require('better-sqlite3')
      const db = new Database(path.join(temporary, 'test.sqlite3'), { nativeBinding: process.env.TAIM_SQLITE_BINDING })
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM HoursLogModels WHERE time < 0').get().n, 0)
      assert.ok(db.prepare('SELECT SUM(time) AS n FROM HoursLogModels').get().n > 0)
      db.close()
    })
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(temporary, 'result.json'), JSON.stringify({ passed: 1, tests: ['Real main startup, title bar, close-to-tray, native recording and quit flush'] }, null, 2))
    app.quit()
  }
  catch (error) {
    await fs.writeFile(path.join(temporary, 'result.json'), JSON.stringify({ error: error.stack }, null, 2))
    app.exit(1)
  }
}
void run()
