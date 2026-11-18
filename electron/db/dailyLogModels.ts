import type Database from 'better-sqlite3'
import type { DailyLogModels } from '../type/types'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

export interface DailyLogDb extends DBConfig {
  getAllData: () => DailyLogModels[]
  getAllYearData: (year: string) => DailyLogModels[]
  getSingleData: (time: string, appModelId: number) => DailyLogModels | undefined
  getDataFromHoursDB: (date: string, appModelId: number) => { dayTime: number }[]
  getDataByTime: (time: string) => DailyLogModels[]
  getDataByTimeRange: (timeStart: string, timeEnd: string) => DailyLogModels[]
  insertData: (dataQuery: DailyLogModels) => void
  updateTime: (time: number, id: number) => void
  deleteData: (time: string, appModelId: number) => void
  clearAll: () => void
}

function useDB(db: Database.Database): DailyLogDb {
  return {
    tableName: 'dailyLogModels',
    tableVersion: 2,
    initTableIfNotExists() {
      db.exec(`create table IF NOT EXISTS DailyLogModels
(
    id integer    not null
        primary key autoincrement,
    dayTime datetime NULL DEFAULT '',
    time int NULL DEFAULT 0,
    appModelId int NULL DEFAULT 0
);
`)
    },
    getAllData() {
      const select = db.prepare<unknown[], DailyLogModels>(`select * from DailyLogModels`).all()
      return select
    },
    getAllYearData(year) {
      const select = db.prepare<unknown[], DailyLogModels>(`select * from DailyLogModels where strftime('%Y', dayTime) = ?`).all(year)
      return select
    },
    getSingleData(time, appModelID) {
      const select = db.prepare<unknown[], DailyLogModels>(`select * from DailyLogModels where dayTime = ? and appModelId = ?`).get(time, appModelID)
      return select
    },
    getDataFromHoursDB(date, appModelId) {
      const sqltmt = db.prepare<unknown[], { dayTime: number }>(`
      SELECT  
          SUM(time) AS dayTime  
      FROM  
          HoursLogModels  
      WHERE  
          appModelId = ?
          AND DATE(hoursTime) = ?; 
    `)
      const select = sqltmt.all(appModelId, date)
      return select
    },
    getDataByTime(time) {
      const select = db.prepare<unknown[], DailyLogModels>(`select * from DailyLogModels where dayTime = ?`).all(time)
      return select
    },
    getDataByTimeRange(timeStart, timeEnd) {
      const select = db.prepare<unknown[], DailyLogModels>(`select * from DailyLogModels where dayTime >= ? and dayTime <= ?`).all(timeStart, timeEnd)
      return select
    },
    insertData(dataQuery) {
      const insertStmt = db.prepare(`insert into DailyLogModels (dayTime, time,appModelId) values (?, ?, ?)`)
      insertStmt.run(dataQuery.dayTime, dataQuery.time, dataQuery.appModelId)
    },
    updateTime(totalTime, id) {
      const updateStmt = db.prepare(`update DailyLogModels set time = ? where id = ? `)
      updateStmt.run(totalTime, id)
    },
    deleteData(time, appModelID) {
      const deleteStmt = db.prepare(`delete from DailyLogModels where dayTime = ? and appModelId = ?`)
      deleteStmt.run(time, appModelID)
    },
    clearAll() {
      db.prepare(`delete from DailyLogModels`).run()
    },
  }
}

const dailyLogDb = useDB(getDB())

export default dailyLogDb
