import { isSelfApp } from '../utils/selfApp'
import appModelDB from './appModels'
import { getDB } from './better-sqlite3'

export function excludeSelfHistory() {
  const db = getDB()
  db.transaction(() => {
    for (const model of appModelDB.getAllAppModel()) {
      if (!isSelfApp({ name: model.name, path: model.file }))
        continue
      db.prepare('DELETE FROM HoursLogModels WHERE appModelId = ?').run(model.id)
      db.prepare('DELETE FROM DailyLogModels WHERE appModelId = ?').run(model.id)
      db.prepare('DELETE FROM AppModels WHERE id = ?').run(model.id)
    }
  })()
}
