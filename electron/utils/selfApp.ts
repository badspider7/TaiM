import path from 'node:path'

function normalize(file: string) {
  return path.win32.normalize(file).toLowerCase()
}

export function isSelfApp(owner: { name: string, path: string, processId?: number }) {
  return owner.processId === process.pid
    || normalize(owner.path) === normalize(process.execPath)
    || /^taim!?(?:\.exe)?$/i.test(owner.name.trim())
    || /^taim!?\.exe$/i.test(path.win32.basename(owner.path))
}
