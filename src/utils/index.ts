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

/**
 * 消除js加减精度问题的加法函数
 *
 * 该函数旨在添加两个数字，考虑到它们可能是整数或小数。对于整数，直接返回它们的和。
 * 对于小数，为了确保精确计算，将小数转换为相同长度的字符串进行处理，然后将结果转换回小数。
 *
 * @param num1 第一个数字
 * @param num2 第二个数字
 * @returns 返回两个数字的和
 */
export function add(num1: number, num2: number): number {
  // 验证输入是否为有效的数字
  // Number.isNaN() 不会尝试将参数转换为数字；全局 isNaN() 函数会将参数强制转换为数字
  if (Number.isNaN(num1) || Number.isNaN(num2)) {
    throw new TypeError('Both num1 and num2 must be valid numbers.')
  }
  // 检查输入是否为小数
  const isDecimalNum1 = num1 % 1 !== 0
  const isDecimalNum2 = num2 % 1 !== 0
  if (!isDecimalNum1 && !isDecimalNum2) {
    return num1 + num2 // 如果两个数字都是整数，则直接返回它们的和
  }
  const num1DeciStr = String(num1).split('.')[1] ?? ''
  const num2DeciStr = String(num2).split('.')[1] ?? ''
  const maxLen = Math.max(num1DeciStr.length, num2DeciStr.length)
  const factor = 10 ** maxLen
  const num1Str = num1.toFixed(maxLen)
  const num2Str = num2.toFixed(maxLen)
  // 将小数点移除并转换为整数相加
  const result = (+num1Str.replace('.', '') + +num2Str.replace('.', '')) / factor
  return result
}
