import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { rebuild } = require('@electron/rebuild')
// SQLite uses Electron's ABI; get-windows ships a portable Node-API binary.
await rebuild({
  buildPath: process.cwd(),
  electronVersion: require('electron/package.json').version,
  onlyModules: ['better-sqlite3'],
})
if (process.platform === 'win32') {
  const windowsRoot = path.dirname(require.resolve('get-windows'))
  const installer = require.resolve('@mapbox/node-pre-gyp/bin/node-pre-gyp')
  const result = spawnSync(process.execPath, [installer, 'install', '--fallback-to-build'], { cwd: windowsRoot, stdio: 'inherit' })
  if (result.status !== 0)
    process.exit(result.status ?? 1)
}
const root = path.dirname(require.resolve('better-sqlite3/package.json'))
const binding = path.join(root, 'build', 'Release', 'better_sqlite3.node')
if (!fs.existsSync(binding))
  throw new Error('SQLite native binding was not built')
fs.mkdirSync('dist-native', { recursive: true })
fs.copyFileSync(binding, 'dist-native/better_sqlite3.node')
console.log('Electron native bindings prepared.')
