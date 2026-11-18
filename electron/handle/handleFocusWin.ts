import { getDB } from '../db/better-sqlite3'
import appModelDB from '../db/appModels'
import hoursLogDB from '../db/hoursLogModels'
import dailyLogDB from '../db/dailyLogModels'
import type { UsageRecord } from '../utils/usage'
import { isSelfApp } from '../utils/selfApp'

export function executeMethodsInOrder(record: UsageRecord) {
  if (!record.name || isSelfApp({ name: record.name, path: record.file }) || !Number.isFinite(record.duration) || record.duration <= 0)
    return
  getDB().transaction(() => {
    let model = appModelDB.getAppModel(record.name)
    if (!model) {
      appModelDB.insertAppModel({ name: record.name, alias: '', description: record.actionDes, file: record.file, categoryId: 0, iconFile: record.iconFile, totalTime: 0 })
      model = appModelDB.getAppModel(record.name)!
    }
    appModelDB.updateTotalTime(record.name, model.totalTime + record.duration)
    const appModelId = model.id!
    const hoursTime = `${record.startTime.slice(0, 13)}:00:00`
    const hour = hoursLogDB.getData(hoursTime, appModelId)
    if (hour)
      hoursLogDB.updateData(hour.time + record.duration, hour.id!)
    else hoursLogDB.insertData({ appModelId, hoursTime, time: record.duration })
    const dayTime = `${hoursTime.slice(0, 10)} 00:00:00`
    const day = dailyLogDB.getSingleData(dayTime, appModelId)
    if (day)
      dailyLogDB.updateTime(day.time + record.duration, day.id!)
    else dailyLogDB.insertData({ appModelId, dayTime, time: record.duration })
  })()
}
