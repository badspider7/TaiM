import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

export async function packageExtension(outputDirectory) {
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'taim-public-extension-'))
  const output = path.resolve(outputDirectory, 'TaiM-Browser-Extension.zip')
  await fs.mkdir(path.dirname(output), { recursive: true })
  for (const name of ['manifest.json', 'background.js', 'options.html', 'options.js', 'options.css', 'README.txt'])
    await fs.copyFile(path.resolve('browser-extension', name), path.join(stage, name))
  // Never copy credentials from an exported, paired extension into a public package.
  await fs.writeFile(path.join(stage, 'connection.js'), 'globalThis.TAIM_CONNECTION = { port: 17384, token: \'\' }\n')
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '$ErrorActionPreference = "Stop"; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory($env:TAIM_EXTENSION_STAGE, $env:TAIM_EXTENSION_STAGE + ".zip"); [System.IO.File]::Copy($env:TAIM_EXTENSION_STAGE + ".zip", $env:TAIM_EXTENSION_ZIP, $true)'], {
    windowsHide: true,
    encoding: 'utf8',
    env: { ...process.env, TAIM_EXTENSION_STAGE: stage, TAIM_EXTENSION_ZIP: output },
  })
  if (result.error || result.status !== 0)
    throw new Error(`Extension packaging failed: ${result.error?.message ?? result.stderr}`)
  return output
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { version } = JSON.parse(await fs.readFile('package.json', 'utf8'))
  console.log(await packageExtension(path.join('release', version)))
}
