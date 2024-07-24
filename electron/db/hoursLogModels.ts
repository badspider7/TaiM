import type Database from 'better-sqlite3'
import type { HoursLogModels } from '../type/types'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

export interface HoursLogModelDB extends DBConfig {
  getData: (time: string, appModelID: number) => HoursLogModels
  insertData: (data: HoursLogModels) => void
  updateData: (totalTime: number, id: number) => void
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
    hoursTime datetime NULL DEFAULT '',
    time int NULL DEFAULT 0,
    appModelId int NULL DEFAULT 0
);
`)
    },
    getData(time, appModelID) {
      const select = db.prepare(`select * from HoursLogModels where hoursTime = ? and appModelId = ?`).get(time, appModelID)
      return select
    },

    insertData(dataQuery) {
      const insertStmt = db.prepare(`insert into HoursLogModels (hoursTime, time,appModelId) values (?, ?, ?)`)
      insertStmt.run(dataQuery.hoursTime, dataQuery.time, dataQuery.appModelId)
    },

    updateData(totalTime, id) {
      const updateStmt = db.prepare(`update HoursLogModels set time = ? where id = ? `)
      updateStmt.run(totalTime, id)
    },
    deleteDataByHour(time, appModelID) {
      const deleteStmt = db.prepare(`delete from HoursLogModels where hoursTime = ? and appModelId = ?`)
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
