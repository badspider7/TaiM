import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'

// Real MV3 worker smoke test in an isolated, headless Edge profile.
const executable = process.env.TAIM_TEST_BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
await fs.access(executable)
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'taim-browser-smoke-'))
const extension = path.join(temporary, 'extension')
await fs.mkdir(extension)
const token = randomBytes(32).toString('hex')
let received
const report = new Promise((resolve) => {
  received = resolve
})
const server = http.createServer((request, response) => {
  if (request.url === '/fixture') {
    response.writeHead(200, { 'Content-Type': 'text/html' }).end('<title>TaiM browser fixture</title><h1>Website tracking fixture</h1>')
    return
  }
  const origin = request.headers.origin
  if (origin)
    response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }
  let body = ''
  request.on('data', part => body += part)
  request.on('end', () => {
    if (request.url === '/v1/activity') {
      received({ origin, authorization: request.headers.authorization, sample: JSON.parse(body) })
      response.writeHead(204).end()
    }
    else { response.writeHead(404).end() }
  })
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
for (const name of ['background.js', 'README.txt'])
  await fs.copyFile(path.resolve('browser-extension', name), path.join(extension, name))
const manifest = JSON.parse(await fs.readFile('browser-extension/manifest.json', 'utf8'))
manifest.host_permissions = [`http://127.0.0.1:${port}/*`]
await fs.writeFile(path.join(extension, 'manifest.json'), JSON.stringify(manifest))
await fs.writeFile(path.join(extension, 'connection.js'), `globalThis.TAIM_CONNECTION = ${JSON.stringify({ port, token })}`)
const child = spawn(executable, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  `--user-data-dir=${path.join(temporary, 'profile')}`,
  `--disable-extensions-except=${extension}`,
`--load-extension=${extension}`,
  `http://127.0.0.1:${port}/fixture`,
], { windowsHide: true, stdio: 'ignore' })
let timeout
try {
  const actual = await Promise.race([report, new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error('Edge extension did not report within 20 seconds')), 20000)
    child.once('error', reject)
  })])
  assert.match(actual.origin, /^chrome-extension:\/\/[a-p]{32}$/)
  assert.equal(actual.authorization, `Bearer ${token}`)
  assert.equal(actual.sample.browser, 'edge')
  assert.equal(typeof actual.sample.focused, 'boolean')
  if (actual.sample.focused)
    assert.equal(actual.sample.url, `http://127.0.0.1:${port}/fixture`)
  console.log('Real Edge MV3 worker reports authenticated tab activity with an extension origin.')
}
finally {
  clearTimeout(timeout)
  if (child.pid && child.exitCode === null) {
    if (process.platform === 'win32')
      await new Promise(resolve => spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('exit', resolve))
    else child.kill()
  }
  server.closeAllConnections()
  server.close()
  console.log(`Browser test artifacts: ${temporary}`)
}
