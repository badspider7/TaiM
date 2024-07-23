export interface AppModel {
  name: string
  alias: string
  description: string
  file: string
  categoryId: number
  iconFile: string
  totalTime: number
}

export interface HoursLogModels {
  id: number
  dataTime: string
  time: number
  appModelId: number
}
