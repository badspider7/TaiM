import type Database from 'better-sqlite3'
import type { HoursLogModels } from '../type/types'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

export interface HoursLogModelDB extends DBConfig {
  getDataByHour: (time: string) => Promise<HoursLogModels>
  insertData: (data: HoursLogModels) => void
  updateData: (time: string, appModelID: number) => void
  deleteDataByHour: (time: string, appModelID: number) => void
  getAllData: () => Promise<HoursLogModels[]>
  clearAllData: () => void

}

function useDB(db: Database.Database): HoursLogModelDB {
  return {
    tableName: 'hoursLogModels',
    tableVersion: 2,
    initTableIfNotExists() {
      db.exec(`create table IF NOT EXISTS HoursLogModels
(
    id integer    not null
        primary key autoincrement,
    dataTime datetime NULL DEFAULT '',
    time integer NULL DEFAULT 0,
    appModelId integer NULL DEFAULT 0
);
`)
    },
    initData() { },

    getDataByHour(time) {
      const select = db.prepare(`select * from HoursLogModels where time = ?`).get(time)
      return select
    },

    insertData(dataQuery) {
      const insertStmt = db.prepare(`insert into HoursLogModels (dataTime, time,appModelId) values (?, ?, ?)`)
      insertStmt.run(dataQuery.dataTime, dataQuery.time, dataQuery.appModelId)
    },

    updateData(time, appModelID) {
      const updateStmt = db.prepare(`update HoursLogModels set time = ? where dataTime = ? and appModelId = ?`)
      updateStmt.run(time, appModelID)
    },
    deleteDataByHour(time, appModelID) {
      const deleteStmt = db.prepare(`delete from HoursLogModels where dataTime = ? and appModelId = ?`)
      deleteStmt.run(time, appModelID)
    },
    getAllData() {
      const select = db.prepare(`select * from HoursLogModels`).all()
      return select
    },
    clearAllData() {
      const deleteStmt = db.prepare(`delete from HoursLogModels`).run()
      deleteStmt.run()
    },
  }
}

const appModelDb = useDB(getDB())
export default appModelDb
