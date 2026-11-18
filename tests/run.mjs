import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'taim-test-'))
const output = path.resolve('node_modules/.cache/taim-tests/integration.mjs')
await build({ entryPoints: ['tests/integration.mjs'], outfile: output, bundle: true, platform: 'node', format: 'esm', packages: 'external' })
const env = { ...process.env, TAIM_DATA_DIR: temporary, TAIM_SQLITE_BINDING: path.resolve('dist-native/better_sqlite3.node') }
delete env.ELECTRON_RUN_AS_NODE
for (const entry of [output, path.resolve('tests/main-smoke.mjs')]) {
  const dataDir = path.join(temporary, path.basename(entry))
  fs.mkdirSync(dataDir)
  const child = spawn(require('electron'), [entry, '--hidden'], { env: { ...env, TAIM_DATA_DIR: dataDir }, stdio: 'inherit', windowsHide: true })
  const timeout = setTimeout(() => child.kill(), 45000)
  const code = await new Promise(resolve => child.on('exit', resolve))
  clearTimeout(timeout)
  const resultPath = path.join(dataDir, 'result.json')
  if (fs.existsSync(resultPath))
    console.log(fs.readFileSync(resultPath, 'utf8'))
  if (code !== 0 || !fs.existsSync(resultPath)) {
    process.exitCode = 1
    break
  }
}
console.log(`Test artifacts: ${temporary}`)
