import type Database from 'better-sqlite3'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

interface AppModel { id: number, name: string, alias: string, file: string, categoryId: number, iconFile: string, totalTime: number }

export interface AppModelDB extends DBConfig {
  queryAppModel: (id: number) => AppModel
  insertAppModel: (appQuery: AppModel) => void
  updateAppModel: (appQuery: AppModel) => void
  deleteAppModel: (id: number) => void
  getAllAppModel: () => AppModel[]
}

function useDB(db: Database.Database): AppModelDB {
  return {
    tableName: 'appModel',
    tableVersion: 1,
    initTableIfNotExists() {
      db.exec(`create table IF NOT EXISTS AppModel
(
    id integer    not null
        primary key autoincrement,
    name nvarchar,
    alias nvarchar ,
    file nvarchar   not null,
    categoryId integer default 0,
    iconFile nvarchar ,
    totalTime nvarchar default 0
);
`)
    },
    initData() { },
    queryAppModel(id) {
      const select = db.prepare(`select * from AppModel where id = ?`).get(id)
      return select
    },
    insertAppModel(appQuery: AppModel) {
      const insertStmt = db.prepare(`insert into AppModel (name, alias, file, categoryId, iconFile, totalTime) values (?, ?, ?, ?, ?, ?)`)
      insertStmt.run(appQuery.name, appQuery.alias, appQuery.file, appQuery.categoryId, appQuery.iconFile, appQuery.totalTime)
    },
    updateAppModel(appQuery: AppModel) {
      const updateStmt = db.prepare(`update AppModel set name = ?, alias = ?, file = ?, categoryId = ?, iconFile = ?, totalTime = ? where id = ?`)
      updateStmt.run(appQuery.name, appQuery.alias, appQuery.file, appQuery.categoryId, appQuery.iconFile, appQuery.totalTime)
    },
    deleteAppModel(id) {
      const deleteStmt = db.prepare(`delete from AppModel where id = ?`)
      deleteStmt.run(id)
    },
    getAllAppModel() {
      const select = db.prepare(`select * from AppModel`).all()
      return select
    },
  }
}

const appModelDb = useDB(getDB())
export default appModelDb
