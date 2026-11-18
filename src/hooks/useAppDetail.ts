import type { AppData, DailyLogModels, HoursLogModels } from '@@/type/types'
import { useAppInfo } from '@/store/app'

export async function useAppDetail(timeList: Array<DailyLogModels | HoursLogModels>): Promise<AppData[]> {
  const store = useAppInfo()
  await store.getAppInfo()
  const models = new Map(store.appInfoList.map(app => [app.id, app]))
  return timeList.flatMap((item) => {
    const model = models.get(item.appModelId)
    return model ? [{ ...model, totalTime: item.time, date: 'dayTime' in item ? item.dayTime : item.hoursTime }] : []
  })
}
