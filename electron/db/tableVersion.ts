import type Database from 'better-sqlite3'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

export interface TableVersionDB extends DBConfig {
  // eslint-disable-next-line ts/no-unsafe-function-type
  initTableIfNotExists: Function
  initTableVersionRecord: (table: string, version: number) => Database.RunResult
  updateTableVersionRecord: (table: string, version: number) => Database.RunResult
  getTableVersion: (table: string) => number
  tableExist: (table: string) => boolean
}

function useDB(db: Database.Database): TableVersionDB {
  return {
    tableName: 'table_version',
    tableVersion: 3,
    initTableIfNotExists() {
      db.exec(`CREATE TABLE IF NOT EXISTS table_version
(
    name    text              not null
        constraint table_version_pk
            primary key,
    version INTEGER default 0 not null
)
`)
    },

    initTableVersionRecord(table: string, version: number) {
      const stmt = db.prepare(`insert into table_version (name, version)
select :table, :version
where not exists(select * from table_version where name = :table)`)
      return stmt.run({ table, version })
    },

    updateTableVersionRecord(table: string, version: number) {
      const stmt = db.prepare(`update table_version set version = :version where name = :table`)
      return stmt.run({ table, version })
    },

    getTableVersion(table: string) {
      const stmt = db.prepare('select version from table_version where name = :name')
      const result = stmt.get({ name: table }) as any
      return result?.version || 0
    },

    tableExist(table: string) {
      const stmt = db.prepare('SELECT count(*) as count FROM sqlite_master WHERE type=\'table\' AND name = :name')
      const result = stmt.get({ name: table }) as any
      return result.count > 0
    },
  }
}

const tableVersionDB: TableVersionDB = useDB(getDB())
export default tableVersionDB
