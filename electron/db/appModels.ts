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
  getAppModelIdByName: (name: string) => number | undefined
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
    categoryId int default 0,
    iconFile nvarchar ,
    totalTime int default 0
);
`)
    },
    getAppModel(name) {
      const select = db.prepare(`select * from AppModels where name = ?`).get(name)
      return select
    },
    insertAppModel(appQuery: AppModel) {
      const insertStmt = db.prepare(`insert into AppModels (name, alias, description,file, categoryId, iconFile, totalTime) values (?, ?, ?,?, ?, ?, ?)`)
      insertStmt.run(appQuery.name, appQuery.alias, appQuery.description, appQuery.file, appQuery.categoryId, appQuery.iconFile, appQuery.totalTime)
    },
    updateAppModel(appQuery: AppModel) {
      const updateStmt = db.prepare(`update AppModels set name = ?, alias = ?, description = ? ,file = ?, categoryId = ?, iconFile = ?, totalTime = ? where id = ?`)
      updateStmt.run(appQuery.name, appQuery.alias, appQuery.description, appQuery.file, appQuery.categoryId, appQuery.iconFile, appQuery.totalTime)
    },
    updateTotalTime(name, totalTime) {
      db.prepare(`update AppModels set totalTime = ? where name = ?`).run(totalTime, name)
    },
    deleteAppModel(id) {
      const deleteStmt = db.prepare(`delete from AppModels where id = ?`)
      deleteStmt.run(id)
    },
    getAllAppModel() {
      const select = db.prepare(`select * from AppModels`).all()
      return select
    },
    clearAllData() {
      const deleteStmt = db.prepare(`delete from AppModels`)
      deleteStmt.run()
    },
    getAppModelIdByName(name: string) {
      const select = db.prepare(`select id from AppModels where name = ?`).get(name)
      return select?.id
    },
  }
}

const appModelDb = useDB(getDB())
export default appModelDb
