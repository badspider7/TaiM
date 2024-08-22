declare const defaultConfig: IConfig
export interface IConfig {
  version: number
  common: {
    autoLaunch: boolean
    keepWindowSize: boolean
    lang: string
    theme: string
  }
  actions: {}
  data: {}
}
export default defaultConfig
