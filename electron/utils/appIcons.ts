import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { app, nativeImage } from 'electron'
import appModelDB from '../db/appModels'
import { getDB } from '../db/better-sqlite3'

const icons = new Map<string, string>()

// getFileIcon sometimes supplies a generic icon for an executable that embeds
// its own. Windows package logos can also live outside the executable.
const windowsIconScript = String.raw`
$ErrorActionPreference = 'Stop'
$file = [Console]::In.ReadToEnd().Trim()
if (-not [IO.File]::Exists($file)) { exit 0 }
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class TaimIcons {
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
  public static extern uint ExtractIconEx(string file, int index, IntPtr[] large, IntPtr[] small, uint count);
  [DllImport("user32.dll")]
  public static extern bool DestroyIcon(IntPtr icon);
}
'@
$source = $null
$directory = [IO.Path]::GetDirectoryName($file)
$manifest = Join-Path $directory 'AppxManifest.xml'
if ([IO.File]::Exists($manifest)) {
  try {
    [xml]$xml = [IO.File]::ReadAllText($manifest)
    foreach ($application in $xml.GetElementsByTagName('Application')) {
      if ($application.GetAttribute('Executable') -ine [IO.Path]::GetFileName($file)) { continue }
      foreach ($element in $application.GetElementsByTagName('*')) {
        if ($element.LocalName -ne 'VisualElements') { continue }
        $relative = $element.GetAttribute('Square44x44Logo')
        if (-not $relative) { continue }
        $candidate = Join-Path $directory $relative
        if ([IO.File]::Exists($candidate)) { $source = $candidate; break }
        $folder = [IO.Path]::GetDirectoryName($candidate)
        $stem = [IO.Path]::GetFileNameWithoutExtension($candidate)
        $source = Get-ChildItem -LiteralPath $folder -Filter "$stem*.png" -File -ErrorAction SilentlyContinue |
          Sort-Object @{ Expression = { if ($_.Name -match 'targetsize-(48|64|96)') { 0 } elseif ($_.Name -match 'scale-200') { 1 } else { 2 } } } |
          Select-Object -First 1 -ExpandProperty FullName
        if ($source) { break }
      }
      if ($source) { break }
    }
  } catch { }
}
if ($source) {
  $bitmap = [System.Drawing.Image]::FromFile($source)
} else {
  $large = New-Object IntPtr[] 1
  $small = New-Object IntPtr[] 1
  if ([TaimIcons]::ExtractIconEx($file, 0, $large, $small, 1) -eq 0) { exit 0 }
  if ($small[0] -ne [IntPtr]::Zero) { [void][TaimIcons]::DestroyIcon($small[0]) }
  if ($large[0] -eq [IntPtr]::Zero) { exit 0 }
  try {
    $icon = [System.Drawing.Icon]::FromHandle($large[0])
    $bitmap = $icon.ToBitmap()
  } finally {
    [void][TaimIcons]::DestroyIcon($large[0])
  }
}
try {
  $stream = New-Object IO.MemoryStream
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  [Console]::Out.Write([Convert]::ToBase64String($stream.ToArray()))
} finally {
  $bitmap.Dispose()
  $stream.Dispose()
}
`

function getWindowsIcon(file: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', windowsIconScript], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
    let output = ''
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, 5000)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      output += chunk
    })
    child.on('error', () => {
      clearTimeout(timeout)
      resolve(null)
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (timedOut || code !== 0) {
        resolve(null)
        return
      }
      if (!output.trim()) {
        resolve('')
        return
      }
      const image = nativeImage.createFromDataURL(`data:image/png;base64,${output.trim()}`)
      resolve(image.isEmpty() ? null : image.toDataURL())
    })
    child.stdin.on('error', () => { /* The child may exit before receiving the path. */ })
    child.stdin.end(file)
  })
}

export async function getApplicationIcon(file: string) {
  const cached = icons.get(file)
  if (cached !== undefined)
    return cached
  let icon = ''
  if (!existsSync(file)) {
    icon = ''
  }
  else if (process.platform === 'win32' && path.win32.extname(file).toLowerCase() === '.exe') {
    const extracted = await getWindowsIcon(file)
    if (extracted === null)
      throw new Error(`Unable to extract application icon: ${file}`)
    icon = extracted
  }
  else {
    try {
      icon = (await app.getFileIcon(file, { size: 'large' })).toDataURL()
    }
    catch { /* Applications without icons still count toward usage. */ }
  }
  if (icons.size >= 256)
    icons.delete(icons.keys().next().value!)
  icons.set(file, icon)
  return icon
}

export async function refreshApplicationIcons() {
  const update = getDB().prepare('UPDATE AppModels SET iconFile = ? WHERE id = ?')
  for (const model of appModelDB.getAllAppModel()) {
    if (!existsSync(model.file))
      continue
    try {
      const icon = await getApplicationIcon(model.file)
      if (icon !== model.iconFile)
        update.run(icon, model.id)
    }
    catch { /* Keep the saved icon when extraction fails. */ }
  }
}
