import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { packageExtension } from '../scripts/package-extension.mjs'

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'taim-extension-package-'))
const archive = await packageExtension(temporary)
const unpacked = path.join(temporary, 'unpacked')
const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '$ErrorActionPreference = "Stop"; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory($env:TAIM_EXTENSION_ZIP, $env:TAIM_EXTENSION_UNPACKED)'], {
  windowsHide: true,
  encoding: 'utf8',
  env: { ...process.env, TAIM_EXTENSION_ZIP: archive, TAIM_EXTENSION_UNPACKED: unpacked },
})
assert.equal(result.status, 0, result.stderr)
assert.deepEqual((await fs.readdir(unpacked)).sort(), ['README.txt', 'background.js', 'connection.js', 'manifest.json', 'options.css', 'options.html', 'options.js'].sort())
const connection = await fs.readFile(path.join(unpacked, 'connection.js'), 'utf8')
assert.ok(connection.includes('token: \'\''))
assert.equal(/[a-f0-9]{64}/.test(connection), false)
const manifest = JSON.parse(await fs.readFile(path.join(unpacked, 'manifest.json'), 'utf8'))
assert.equal(manifest.action.default_popup, 'options.html')
assert.equal(manifest.permissions.includes('storage'), true)
console.log('Public extension ZIP verified: root manifest, pairing UI, no personal credentials.')
