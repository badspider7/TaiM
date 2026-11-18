import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'taim-release-'))
const version = '1.2.3-beta.2'
const output = path.join(temporary, 'release', version)
await fs.mkdir(output, { recursive: true })
await fs.writeFile(path.join(temporary, 'package.json'), JSON.stringify({ version }))
const name = `TaiM-Windows-${version}-Setup.exe`
const body = Buffer.from('Release verification fixture; never executed')
const sha512 = createHash('sha512').update(body).digest('base64')
const manifest = { version, path: name, sha512, releaseNotes: `Release ${version}`, files: [{ url: name, sha512, size: body.length }] }
await fs.writeFile(path.join(output, name), body)
await fs.writeFile(path.join(output, `${name}.blockmap`), 'blockmap fixture')
await fs.writeFile(path.join(output, 'latest.yml'), JSON.stringify(manifest))
await fs.writeFile(path.join(output, 'builder-debug.yml'), 'debug:\n  reason: diagnostic output, not an update manifest\n')
function verify() {
  return spawnSync(process.execPath, [path.resolve('scripts/verify-release.mjs')], {
    cwd: temporary,
    encoding: 'utf8',
    env: { ...process.env, RELEASE_TAG: `v${version}` },
  })
}
const valid = verify()
assert.equal(valid.status, 0, valid.stderr)
assert.equal((await fs.readFile(path.join(output, 'SHA256SUMS.txt'), 'utf8')).includes('builder-debug'), false)
await fs.writeFile(path.join(output, name), 'tampered installer')
const invalid = verify()
assert.notEqual(invalid.status, 0)
assert.ok(invalid.stderr.includes('Installer checksum mismatch'))
console.log('Release verification passed: diagnostic YAML excluded, tampered installer rejected.')
