import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { app } from 'electron'
import { getDB } from '../db/better-sqlite3'
import { splitInterval } from '../utils/usage'

export interface WebsiteHour {
  browser: string
  url: string
  domain: string
  title: string
  hoursTime: string
  time: number
}
interface Sample {
  client: string
  sequence: number
  browser: 'chrome' | 'edge'
  focused: boolean
  url: string
  title: string
  receivedAt: number
}
const freshness = 2500
export const defaultBrowserPort = 17384

export function normalizeWebUrl(value: string) {
  if (value.length > 8192)
    throw new Error('网址过长')
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('仅支持 HTTP / HTTPS 网页')
  url.username = ''
  url.password = ''
  url.hash = ''
  return { url: url.href, domain: url.hostname }
}

export function initWebsiteTable() {
  getDB().exec(`CREATE TABLE IF NOT EXISTS WebsiteHours (
    browser TEXT NOT NULL, url TEXT NOT NULL, domain TEXT NOT NULL, title TEXT NOT NULL,
    hoursTime TEXT NOT NULL, time REAL NOT NULL,
    PRIMARY KEY (browser, url, hoursTime)
  ); CREATE INDEX IF NOT EXISTS idx_website_time ON WebsiteHours(hoursTime);`)
}

export class BrowserTracking {
  private server?: http.Server
  private token = ''
  private enabled = false
  private initialized = false
  private port = defaultBrowserPort
  private error = ''
  private samples = new Map<string, Sample>()
  private current?: { sample: Sample, since: number, observedAt: number }
  private records = new Map<string, WebsiteHour>()

  constructor(private now = () => Date.now()) {}

  private get settingsPath() {
    return path.join(app.getPath('userData'), 'browser-tracking.json')
  }

  async initialize() {
    if (this.initialized)
      return
    try {
      const saved = JSON.parse(await fs.readFile(this.settingsPath, 'utf8'))
      this.enabled = saved.enabled === true
      if (typeof saved.token === 'string' && /^[a-f0-9]{64}$/.test(saved.token))
        this.token = saved.token
    }
    catch { /* First launch or invalid configuration. */ }
    this.token ||= randomBytes(32).toString('hex')
    this.initialized = true
    await this.save()
  }

  private async save() {
    await fs.mkdir(app.getPath('userData'), { recursive: true })
    await fs.writeFile(`${this.settingsPath}.tmp`, JSON.stringify({ enabled: this.enabled, token: this.token }))
    await fs.rename(`${this.settingsPath}.tmp`, this.settingsPath)
  }

  status() {
    const now = this.now()
    return { enabled: this.enabled, listening: !!this.server?.listening, port: this.port, error: this.error, connected: [...this.samples.values()].some(s => now >= s.receivedAt && now - s.receivedAt < freshness) }
  }

  async start() {
    await this.initialize()
    if (this.enabled) {
      try {
        await this.listen()
      }
      catch (error) { this.error = `网址连接服务启动失败：${String(error)}` }
    }
  }

  async setEnabled(enabled: boolean, port = defaultBrowserPort) {
    await this.initialize()
    if (enabled) {
      await this.listen(port)
      this.enabled = true
    }
    else {
      this.stop()
      this.enabled = false
    }
    await this.save()
    return this.status()
  }

  private async listen(port = defaultBrowserPort) {
    if (this.server?.listening)
      return
    const server = http.createServer((request, response) => {
      const origin = request.headers.origin ?? ''
      if (!/^chrome-extension:\/\/[a-p]{32}$/.test(origin)
        || request.headers.host !== `127.0.0.1:${this.port}` || request.url !== '/v1/activity') {
        response.writeHead(403).end()
        return
      }
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Vary', 'Origin')
      if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Methods', 'POST')
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        response.writeHead(204).end()
        return
      }
      const token = Buffer.from(request.headers.authorization ?? '')
      const expected = Buffer.from(`Bearer ${this.token}`)
      if (request.method !== 'POST' || token.length !== expected.length || !timingSafeEqual(token, expected)) {
        response.writeHead(401).end()
        return
      }
      if (!request.headers['content-type']?.startsWith('application/json')) {
        response.writeHead(415).end()
        return
      }
      let body = ''
      let oversized = false
      request.setEncoding('utf8')
      request.on('data', (part: string) => {
        if (oversized)
          return
        body += part
        if (Buffer.byteLength(body) > 16384) {
          oversized = true
          response.writeHead(413).end()
          request.destroy()
        }
      })
      request.on('error', () => response.destroy())
      request.on('end', () => {
        if (oversized)
          return
        try {
          this.accept(JSON.parse(body))
          response.writeHead(204).end()
        }
        catch { response.writeHead(400).end() }
      })
    })
    server.requestTimeout = 5000
    server.headersTimeout = 5000
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', reject)
        resolve()
      })
    })
    this.server = server
    this.port = (server.address() as { port: number }).port
    this.error = ''
    server.on('error', (error) => {
      this.error = String(error)
      this.stop()
    })
  }

  accept(value: unknown) {
    const v = value as Sample
    if (!v || typeof v.client !== 'string' || !/^[\w-]{1,80}$/.test(v.client)
      || !Number.isSafeInteger(v.sequence) || v.sequence < 0 || !['chrome', 'edge'].includes(v.browser)
      || typeof v.focused !== 'boolean' || typeof v.url !== 'string' || typeof v.title !== 'string' || v.title.length > 512) {
      throw new Error('无效标签页信息')
    }
    const previous = this.samples.get(v.client)
    if (previous && v.sequence <= previous.sequence)
      return
    const normalized = v.focused ? normalizeWebUrl(v.url).url : ''
    const sample: Sample = { client: v.client, sequence: v.sequence, browser: v.browser, focused: v.focused, url: normalized, title: v.title, receivedAt: this.now() }
    if (this.current?.sample.client === sample.client) {
      const observedAt = this.current.observedAt
      const continuing = sample.focused && sample.url === this.current.sample.url
        && sample.browser === this.current.sample.browser && sample.title === this.current.sample.title
      this.checkpoint()
      // A changed page must be matched to the OS foreground window again.
      this.current = continuing ? { sample, since: sample.receivedAt, observedAt } : undefined
    }
    if (this.samples.size >= 16 && !previous)
      this.samples.delete(this.samples.keys().next().value!)
    this.samples.set(sample.client, sample)
  }

  observe(file: string, title: string, now = this.now()) {
    this.current = undefined
    if (!this.enabled || !this.server?.listening)
      return
    const browser = /(?:^|[\\/])msedge\.exe$/i.test(file) ? 'edge' : /(?:^|[\\/])chrome\.exe$/i.test(file) ? 'chrome' : ''
    const sample = [...this.samples.values()].filter(s => s.focused && s.browser === browser
      && now >= s.receivedAt && now - s.receivedAt < freshness
      && s.title && (title === s.title || title.startsWith(`${s.title} - `))).sort((a, b) => b.receivedAt - a.receivedAt)[0]
    if (sample)
      this.current = { sample, since: now, observedAt: now }
  }

  checkpoint(now = this.now()) {
    if (!this.current)
      return
    const { sample, since, observedAt } = this.current
    if (now - since <= 5000 && this.enabled) {
      // Heartbeats cannot extend an old OS foreground/idle observation indefinitely.
      for (const segment of splitInterval(since, Math.min(now, sample.receivedAt + freshness, observedAt + freshness))) {
        const key = JSON.stringify([sample.browser, sample.url, segment.startTime])
        const old = this.records.get(key)
        this.records.set(key, { browser: sample.browser, ...normalizeWebUrl(sample.url), title: sample.title, hoursTime: segment.startTime, time: (old?.time ?? 0) + segment.duration })
      }
    }
    this.current.since = now
  }

  pause() {
    this.checkpoint()
    this.current = undefined
  }

  flush() {
    const write = getDB().prepare(`INSERT INTO WebsiteHours(browser, url, domain, title, hoursTime, time) VALUES (@browser, @url, @domain, @title, @hoursTime, @time)
      ON CONFLICT(browser, url, hoursTime) DO UPDATE SET time = time + excluded.time, title = excluded.title`)
    getDB().transaction(() => {
      for (const record of this.records.values()) write.run(record)
    })()
    this.records.clear()
  }

  clear() {
    this.current = undefined
    this.records.clear()
    this.samples.clear()
    getDB().exec('DELETE FROM WebsiteHours')
  }

  stop() {
    this.pause()
    this.server?.close()
    this.server?.closeAllConnections()
    this.server = undefined
    this.samples.clear()
  }

  async pairingCode() {
    await this.initialize()
    return this.token
  }

  async exportExtension() {
    await this.initialize()
    const target = path.join(app.getPath('userData'), 'browser-extension')
    await fs.mkdir(target, { recursive: true })
    for (const name of ['manifest.json', 'background.js', 'options.html', 'options.js', 'options.css', 'README.txt'])
      await fs.copyFile(path.join(app.getAppPath(), 'browser-extension', name), path.join(target, name))
    await fs.writeFile(path.join(target, 'connection.js'), `globalThis.TAIM_CONNECTION = ${JSON.stringify({ port: defaultBrowserPort, token: this.token })}\n`)
    return target
  }
}

export const browserTracking = new BrowserTracking()
