import { Buffer } from 'node:buffer'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import http from 'node:http'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import updaterPackage from 'electron-updater'
import { UpdateService, releaseNotesText } from '../electron/update/UpdateService.ts'

const info = { version: '0.0.2-beta.1', releaseDate: '2026-11-18T00:00:00Z', releaseNotes: '<p>修复计时</p><p>新增功能</p>' }
class FakeUpdater extends EventEmitter {
  checkCalls = 0
  downloadCalls = 0
  installs = []
  async checkForUpdates() {
    this.checkCalls++
    if (this.checkAction)
      await this.checkAction()
    else this.emit('update-available', info)
    return { updateInfo: info }
  }

  async downloadUpdate() {
    this.downloadCalls++
    if (this.downloadAction) {
      await this.downloadAction()
    }
    else {
      this.emit('download-progress', { percent: 50, transferred: 100, total: 200, bytesPerSecond: 20 })
      this.emit('update-downloaded', info)
    }
    return ['test-installer.exe']
  }

  quitAndInstall(...args) { this.installs.push(args) }
}

function create(client = new FakeUpdater(), overrides = {}) {
  const states = []
  const options = {
    currentVersion: '0.0.1-beta',
    disabledReason: '开发模式不可用',
    notify: state => states.push(state),
    beforeInstall() {},
    installFailed() {},
    logError() {},
    ...overrides,
  }
  return { client, states, service: new UpdateService(client, options) }
}

export async function testUpdates(test, temporary) {
  await test('Updater guards duplicate checks and downloads and installs only downloaded updates', async () => {
    let finish
    const { client, states, service } = create()
    client.checkAction = () => new Promise((resolve) => {
      finish = resolve
    })
    const checking = service.check()
    await service.check()
    service.install()
    await service.download()
    assert.equal(client.checkCalls, 1)
    assert.equal(client.downloadCalls, 0)
    assert.equal(client.installs.length, 0)
    client.emit('update-available', info)
    finish()
    await checking
    assert.equal(client.autoDownload, false)
    assert.equal(client.autoInstallOnAppQuit, false)
    assert.equal(client.allowPrerelease, true)
    assert.equal(client.allowDowngrade, false)
    await service.download()
    assert.equal(states.some(state => state.percent === 50), true)
    assert.equal(service.snapshot().phase, 'downloaded')
    await service.check()
    await service.download()
    assert.equal(client.checkCalls, 1)
    assert.equal(client.downloadCalls, 1)
    service.install()
    service.install()
    assert.deepEqual(client.installs, [[false, true]])
  })
  await test('Updater handles network errors, download retries, failed save and disabled development mode', async () => {
    let recovered = 0
    const { client, service } = create(new FakeUpdater(), {
      beforeInstall() { throw new Error('disk full') },
      installFailed() { recovered++ },
    })
    client.checkAction = async () => {
      throw new Error('net::ERR_CONNECTION_RESET')
    }
    await service.check()
    assert.equal(service.snapshot().phase, 'error')
    assert.ok(service.snapshot().message.includes('网络'))
    client.checkAction = undefined
    await service.check()
    client.downloadAction = async () => {
      throw new Error('checksum mismatch')
    }
    await service.download()
    assert.equal(service.snapshot().failedStage, 'download')
    assert.ok(service.snapshot().message.includes('校验'))
    client.downloadAction = undefined
    await service.download()
    service.install()
    assert.equal(client.installs.length, 0)
    assert.equal(service.snapshot().failedStage, 'install')
    assert.equal(recovered, 1)
    const disabled = new UpdateService(undefined, { currentVersion: '1.0.0', notify() {}, beforeInstall() {}, installFailed() {}, logError() {} })
    assert.equal((await disabled.check()).phase, 'disabled')
    assert.equal((await disabled.download()).phase, 'disabled')
    assert.equal(disabled.install().phase, 'disabled')
    const latest = create()
    latest.client.checkAction = async () => latest.client.emit('update-not-available', info)
    await latest.service.check()
    assert.equal(latest.service.snapshot().phase, 'not-available')
    const stable = create(new FakeUpdater(), { currentVersion: '1.0.0' })
    assert.equal(stable.client.allowPrerelease, false)
  })
  await test('Update notes support GitHub HTML and multi-version notes without rendering markup', () => {
    assert.equal(releaseNotesText(info.releaseNotes), '修复计时\n新增功能')
    assert.equal(releaseNotesText([{ version: '2.0.0', note: 'Hello' }, { version: '1.1.0', note: null }]), '2.0.0\nHello\n\n1.1.0')
    assert.equal(releaseNotesText(undefined), '')
  })
  await test('Real electron-updater checks, downloads and validates a local HTTP fixture without installing', async () => {
    // Deliberately not an executable; never call quitAndInstall on this client.
    const body = Buffer.alloc(128 * 1024, 0x54)
    const hash = createHash('sha512').update(body).digest('base64')
    const metadata = `version: 99.0.0\nfiles:\n  - url: TaiM-fixture.exe\n    sha512: ${hash}\n    size: ${body.length}\npath: TaiM-fixture.exe\nsha512: ${hash}\nreleaseDate: 2026-11-18T00:00:00Z\nreleaseNotes: Local fixture update\n`
    let tampered = false
    const server = http.createServer((request, response) => {
      if (request.url.startsWith('/latest.yml')) {
        response.end(metadata)
      }
      else if (request.url.startsWith('/TaiM-fixture.exe')) {
        response.end(tampered ? Buffer.alloc(body.length, 0x41) : body)
      }
      else {
        response.statusCode = 404
        response.end()
      }
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    try {
      const url = `http://127.0.0.1:${server.address().port}/`
      const config = path.join(temporary, 'test-update.yml')
      await fs.writeFile(config, `provider: generic\nurl: ${url}\nupdaterCacheDirName: taim-fixture-${Date.now()}\n`)
      const client = new updaterPackage.NsisUpdater()
      Object.defineProperty(client.app, 'baseCachePath', { value: temporary })
      client.forceDevUpdateConfig = true
      client.updateConfigPath = config
      client.disableDifferentialDownload = true
      client.logger = null
      const { service } = create(client, { currentVersion: '1.0.0' })
      await service.check()
      assert.equal(service.snapshot().phase, 'available')
      assert.equal(service.snapshot().availableVersion, '99.0.0')
      await service.download()
      assert.equal(service.snapshot().phase, 'downloaded')
      assert.equal(service.snapshot().percent, 100)
      assert.equal(client.autoInstallOnAppQuit, false)
      tampered = true
      const invalidClient = new updaterPackage.NsisUpdater()
      Object.defineProperty(invalidClient.app, 'baseCachePath', { value: path.join(temporary, 'tampered') })
      invalidClient.forceDevUpdateConfig = true
      invalidClient.updateConfigPath = config
      invalidClient.disableDifferentialDownload = true
      invalidClient.logger = null
      const rejected = create(invalidClient, { currentVersion: '1.0.0' })
      await rejected.service.check()
      await rejected.service.download()
      assert.equal(rejected.service.snapshot().phase, 'error')
      assert.equal(rejected.service.snapshot().failedStage, 'download')
      assert.ok(rejected.service.snapshot().message.includes('校验'))
    }
    finally { await new Promise(resolve => server.close(resolve)) }
  })
}
