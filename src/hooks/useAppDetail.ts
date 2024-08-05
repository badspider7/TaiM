import type { AppData, AppModel, DailyLogModels, HoursLogModels } from '@@/type/types'
import { useAppInfo } from '@/store/app'

const appStore = useAppInfo()

export function useAppDetail(TimeList: Array<DailyLogModels | HoursLogModels>, appInfo: AppModel[]) {
  // 创建一个映射，以快速查找应用信息
  const appInfoMap = appInfo.reduce((map: Record<string | number, AppModel>, app) => {
    map[app.id!] = app
    return map
  }, {})

  const appDataList: Array<AppData> = []
  TimeList.forEach((item) => {
    let appModel = appInfoMap[item.appModelId]
    if (!appModel) {
      // 如果当前appModelId不在appInfoMap中，则尝试从appStore中获取
      const updatedAppInfo: any = appStore.getAppInfo()
      // 更新appInfoMap
      const updatedAppInfoMap = updatedAppInfo.reduce((map: Record<number, AppModel>, app: AppModel) => {
        map[app.id as number] = app
        return map
      }, {})
      // 再次尝试获取
      appModel = updatedAppInfoMap[item.appModelId]
    }

    // 判断是DailyLogModels 还是 HoursLogModels
    let date = null

    if (Object.hasOwn(item, 'dayTime')) {
      date = (item as DailyLogModels).dayTime
    }
    else {
      date = (item as HoursLogModels).hoursTime
    }
    if (appModel) {
      const tempObj: AppData = { ...appModel, totalTime: item.time, date }
      appDataList.push(tempObj)
    }
    else {
      console.warn(`No app found for appModelId: ${item.appModelId}`)
    }
  })

  return appDataList
}
