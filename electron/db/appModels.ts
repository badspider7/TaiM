import type Database from 'better-sqlite3'
import { getDB } from './better-sqlite3'
import type { DBConfig } from './index'

export interface AppModelDB extends DBConfig {
  getModel: (id: number) => void
}

function useDB(db: Database.Database): AppModelDB {
  return {
    tableName: 'appModel',
    tableVersion: 1,
    initTableIfNotExists() {
      db.exec(`create table IF NOT EXISTS AppModel
(
    id integer not null
        primary key autoincrement,
    name nvarchar(255),
    alias nvarchar(255) ,
    file nvarchar(255) not null,
    categoryId default 0,
    iconFile nvarchar(255) ,
    totalTime default 0
);

`)
    },

    initData() { },
    getModel() {

    },
  }
}

const appModelDb = useDB(getDB())
export default appModelDb
