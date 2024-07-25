export interface AppModel {
  id?: number
  name: string
  alias: string
  description: string
  file: string
  categoryId: number
  iconFile: string
  totalTime: number
}

export interface HoursLogModels {
  id?: number
  hoursTime: string
  time: number
  appModelId: number
}

export interface DailyLogModels {
  id?: number
  dayTime: string
  time: number
  appModelId: number
}

export interface AppData {
  id?: number
  name: string
  alias: string
  categoryId: number
  date: string
  description: string
  file: string
  iconFile: string
  totalTime: number
}
