import type { DailyLogModels } from '@@/type/types'
import getUsageTimeApi from '@/api/getUsageTime'

/**
 * @description  format date time string like '2023/10/10 10:10:10' to '2023-10-10 00:00:00'
 * @param dateTimeString <string>
 * @returns formatDate  <string>
 */
export function formatDateTime(dateTimeString: string) {
  return dateTimeString.replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{2}):(\d{2}):(\d{2})$/, (match, year, month, day, hour, minute, second) => {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`
  })
}

export async function handleTimeRangeData(start: string, end: string) {
  const weekTimeList = await getUsageTimeApi.getWeekTime(start, end)
  const appModelTimeSums: Record<number, DailyLogModels > = {}
  weekTimeList.forEach((item: DailyLogModels) => {
    if (!appModelTimeSums[item.appModelId]) {
      appModelTimeSums[item.appModelId] = { appModelId: item.appModelId, time: 0, dayTime: '' }
    }
    appModelTimeSums[item.appModelId].time += item.time
  })
  const mergedData: DailyLogModels[] = Object.values(appModelTimeSums)
  return mergedData
}
