const defaultConfig: IConfig = {
  version: 1,
  common: {
    autoLaunch: true,
    keepWindowSize: false,
    lang: 'zh-CN',
    theme: 'light',
  },
  actions: {

  },
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

  }
  data: {

  }
}

export default defaultConfig
