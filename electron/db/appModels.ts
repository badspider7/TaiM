import type Database from 'better-sqlite3'
import type { AppModel } from '../type/types'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

export interface AppModelDB extends DBConfig {
  getAppModel: (name: string) => AppModel | undefined
  insertAppModel: (appQuery: AppModel) => void
  updateAppModel: (appQuery: AppModel) => void
  updateTotalTime: (name: string, totalTime: number) => void
  deleteAppModel: (id: number) => void
  getAllAppModel: () => AppModel[]
  clearAllData: () => void
  getAppModelIdByName: (name: string) => number
}

function useDB(db: Database.Database): AppModelDB {
  return {
    tableName: 'appModels',
    tableVersion: 2,
    initTableIfNotExists() {
      db.exec(`create table IF NOT EXISTS AppModels
(
    id integer    not null
        primary key autoincrement,
    name nvarchar,
    alias nvarchar ,
    description nvarchar ,
    file nvarchar   not null,
    categoryId integer default 0,
    iconFile nvarchar ,
    totalTime integer default 0
);
`)
    },
    initData() { },
    getAppModel(name) {
      const select = db.prepare(`select * from AppModel where name = ?`).get(name)
      return select
    },
    insertAppModel(appQuery: AppModel) {
      const insertStmt = db.prepare(`insert into AppModel (name, alias, description,file, categoryId, iconFile, totalTime) values (?, ?, ?,?, ?, ?, ?)`)
      insertStmt.run(appQuery.name, appQuery.alias, appQuery.description, appQuery.file, appQuery.categoryId, appQuery.iconFile, appQuery.totalTime)
    },
    updateAppModel(appQuery: AppModel) {
      const updateStmt = db.prepare(`update AppModel set name = ?, alias = ?, description = ? ,file = ?, categoryId = ?, iconFile = ?, totalTime = ? where id = ?`)
      updateStmt.run(appQuery.name, appQuery.alias, appQuery.description, appQuery.file, appQuery.categoryId, appQuery.iconFile, appQuery.totalTime)
    },
    updateTotalTime(name, totalTime) {
      db.prepare(`update AppModel set totalTime = ? where name = ?`).run(totalTime, name)
    },
    deleteAppModel(id) {
      const deleteStmt = db.prepare(`delete from AppModel where id = ?`)
      deleteStmt.run(id)
    },
    getAllAppModel() {
      const select = db.prepare(`select * from AppModel`).all()
      return select
    },
    clearAllData() {
      const deleteStmt = db.prepare(`delete from AppModel`)
      deleteStmt.run()
    },
    getAppModelIdByName(name: string) {
      const select = db.prepare(`select id from AppModel where name = ?`).get(name)
      return select.id
    },
  }
}

const appModelDb = useDB(getDB())
export default appModelDb
