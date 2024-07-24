import logger from '../logger'
import tableVersionDB from './tableVersion'
import appModelDB from './appModels'
import hoursLogModelDB from './hoursLogModels'
import dailyLogModelDB from './dailyLogModels'

export interface DBConfig {
  // eslint-disable-next-line ts/no-unsafe-function-type
  initTableIfNotExists: Function
  tableName: string
  tableVersion: number
}

export function initDb() {
  // tableVersion表的本身的版本：数据库表发生变动了就+1，其他表的版本：当前表变动后版本+1
  if (tableVersionDB.tableExist(tableVersionDB.tableName)) {
    const ver = tableVersionDB.getTableVersion(tableVersionDB.tableName)
    if (ver === tableVersionDB.tableVersion) {
      return
    }
    // 不考虑数据库版本大于代码版本
    logger.info('数据库当前版本: %s,和代码版本: %s不一致', ver, tableVersionDB.tableVersion)
  }
  logger.info('数据库开始初始化')
  tableVersionDB.initTableIfNotExists()
  // 每个表都手动记录版本号，为以后表结构变更更新提供信息
  const DBConfigs = [tableVersionDB, appModelDB, hoursLogModelDB, dailyLogModelDB]
  DBConfigs.forEach((item: DBConfig) => {
    const result = tableVersionDB.initTableVersionRecord(item.tableName, 1)
    if (result.changes) {
      // 如果插入版本号成功，说明该表没建立过
      item.initTableIfNotExists()
    }
    else {
      // 这里取版本号，做对应策略表更新
      if (tableVersionDB.getTableVersion(item.tableName) !== item.tableVersion) {
        // 版本不一样，进行更新
      }
    }
  })
  tableVersionDB.updateTableVersionRecord(tableVersionDB.tableName, tableVersionDB.tableVersion)
}
