import path from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import logger from '../logger'

const bind_path = process.env.TAIM_SQLITE_BINDING || path.join(app.getAppPath(), 'dist-native', 'better_sqlite3.node')
const TAG = '[better-sqlite3] '
const IS_DEV = process.env.VITE_DEV_SERVER_URL

let db: Database.Database | undefined
process.on('exit', () => db?.close())

export function getDB() {
  if (db) {
    return db
  }
  return IS_DEV ? getSqlite3('sqlite3.db') : getSqlite3()
}

function getSqlite3(filename = path.join(app.getPath('userData'), 'better-sqlite3.sqlite3')): Database.Database {
  filename = process.env.TAIM_DATA_DIR ? path.join(process.env.TAIM_DATA_DIR, 'test.sqlite3') : filename
  db = new Database(filename, {
    // https://github.com/WiseLibs/better-sqlite3/blob/v8.5.2/lib/database.js#L36
    // https://github.com/WiseLibs/better-sqlite3/blob/v8.5.2/lib/database.js#L50
    nativeBinding: bind_path,
    // verbose: process.env.production
    //   ? () => {}
    //   : (message?: unknown, ...additionalArgs: unknown[]) => logger.debug('sql', message, additionalArgs),
  })
  db.pragma('journal_mode = WAL')
  logger.debug(TAG, bind_path, 'load')
  return db
}
