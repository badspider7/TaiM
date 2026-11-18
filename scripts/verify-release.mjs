import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { load } from 'js-yaml'

const { version } = JSON.parse(await fs.readFile('package.json', 'utf8'))
if (process.env.RELEASE_TAG)
  assert.equal(process.env.RELEASE_TAG, `v${version}`, 'Tag and package version must match')
const directory = path.join('release', version)
const installerName = `TaiM-Windows-${version}-Setup.exe`
const files = await fs.readdir(directory)
const manifests = files.filter(name => name.endsWith('.yml'))
assert.ok(manifests.includes('latest.yml'), 'Missing GitHub update manifest')
assert.ok((await fs.stat(path.join(directory, `${installerName}.blockmap`))).size > 0, 'Missing blockmap')
const installer = await fs.readFile(path.join(directory, installerName))
const sha512 = createHash('sha512').update(installer).digest('base64')
for (const name of manifests) {
  const manifest = load(await fs.readFile(path.join(directory, name), 'utf8'))
  assert.equal(manifest.version, version, 'Update version must match package version')
  assert.equal(manifest.path, installerName, 'Update must reference the generated installer')
  assert.equal(manifest.sha512, sha512, 'Installer checksum mismatch')
  assert.ok(typeof manifest.releaseNotes === 'string' && manifest.releaseNotes.includes(version), 'Versioned release notes are required')
  assert.ok(manifest.files.some(file => file.url === installerName && file.sha512 === sha512 && file.size === installer.length), 'Invalid installer metadata')
}
const assets = [installerName, `${installerName}.blockmap`, ...manifests].sort()
const checksums = await Promise.all(assets.map(async name => `${createHash('sha256').update(await fs.readFile(path.join(directory, name))).digest('hex')}  ${name}`))
await fs.writeFile(path.join(directory, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`)
console.log(`Verified ${version}: installer, blockmap, update metadata and release notes. Checksums generated.`)
