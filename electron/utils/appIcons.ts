import { app } from 'electron'
import appModelDB from '../db/appModels'
import { getDB } from '../db/better-sqlite3'

const icons = new Map<string, string>()

export async function getApplicationIcon(file: string) {
  const cached = icons.get(file)
  if (cached !== undefined)
    return cached
  // Small icons are 16px on Windows and blur on high-DPI displays.
  let icon = ''
  try {
    icon = (await app.getFileIcon(file, { size: 'large' })).toDataURL()
  }
  catch { /* Cache missing icons to avoid retrying every polling tick. */ }
  if (icons.size >= 256)
    icons.delete(icons.keys().next().value!)
  icons.set(file, icon)
  return icon
}

export async function refreshApplicationIcons() {
  const update = getDB().prepare('UPDATE AppModels SET iconFile = ? WHERE id = ?')
  for (const model of appModelDB.getAllAppModel()) {
    try {
      const icon = await getApplicationIcon(model.file)
      if (icon)
        update.run(icon, model.id)
    }
    catch { /* Keep the saved icon when an application is unavailable. */ }
  }
}
