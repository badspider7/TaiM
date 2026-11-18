import tableVersionDB from './tableVersion'
import appModelDB from './appModels'
import hoursLogModelDB from './hoursLogModels'
import dailyLogModelDB from './dailyLogModels'
import { getDB } from './better-sqlite3'

export interface DBConfig {

  initTableIfNotExists: () => void
  tableName: string
  tableVersion: number
}

export function initDb() {
  // Ensure every table exists on each startup, including newly introduced tables.
  getDB().transaction(() => {
    for (const model of [tableVersionDB, appModelDB, hoursLogModelDB, dailyLogModelDB]) {
      model.initTableIfNotExists()
      tableVersionDB.initTableVersionRecord(model.tableName, model.tableVersion)
    }
    getDB().exec(`
      CREATE TABLE IF NOT EXISTS Categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
      CREATE INDEX IF NOT EXISTS idx_hours_app_time ON HoursLogModels(hoursTime, appModelId);
      CREATE INDEX IF NOT EXISTS idx_daily_app_time ON DailyLogModels(dayTime, appModelId);
      CREATE INDEX IF NOT EXISTS idx_app_name ON AppModels(name);
    `)
  })()
}
