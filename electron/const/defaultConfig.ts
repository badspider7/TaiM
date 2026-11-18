const defaultConfig: IConfig = {
  version: 1,
  common: {
    autoLaunch: false,
    keepWindowSize: false,
    lang: 'zh-CN',
    theme: 'light',
  },
  actions: { idleMinutes: 5, ignoredApps: [] },
  data: {

  },
}

export interface IConfig {
  version: number
  common: {
    autoLaunch: boolean
    keepWindowSize: boolean
    lang: string
    theme: string
  }
  actions: {
    idleMinutes: number
    ignoredApps: string[]
  }
  data: {

  }
}

export default defaultConfig
