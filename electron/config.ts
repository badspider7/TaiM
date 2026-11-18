import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import defaults, { type IConfig } from './const/defaultConfig'
import logger from './logger'

let config: IConfig | undefined
function configPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function validateConfig(value: unknown): IConfig {
  const v = value as IConfig
  if (!v || typeof v !== 'object' || !v.common || !v.actions
    || typeof v.common.autoLaunch !== 'boolean' || typeof v.common.keepWindowSize !== 'boolean'
    || !['light', 'dark', 'system'].includes(v.common.theme) || v.common.lang !== 'zh-CN'
    || !Number.isInteger(v.actions.idleMinutes) || v.actions.idleMinutes < 1 || v.actions.idleMinutes > 60
    || !Array.isArray(v.actions.ignoredApps) || v.actions.ignoredApps.length > 500
    || v.actions.ignoredApps.some(n => typeof n !== 'string' || !n.trim() || n.length > 260)) {
    throw new Error('设置格式无效')
  }
  return { version: 1, common: { ...v.common }, actions: { idleMinutes: v.actions.idleMinutes, ignoredApps: [...new Set(v.actions.ignoredApps.map(n => n.trim()))] }, data: {},
  }
}

export function getConfig(): IConfig {
  if (!config) {
    try {
      const saved = JSON.parse(fs.readFileSync(configPath(), 'utf8'))
      config = validateConfig({ ...defaults, ...saved, common: { ...defaults.common, ...saved.common, lang: 'zh-CN' }, actions: { ...defaults.actions, ...saved.actions },
      })
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        logger.warn('无法读取设置，使用默认值', error)
      config = structuredClone(defaults)
    }
  }
  return structuredClone(config)
}

export function saveConfig(value: unknown) {
  const next = validateConfig(value)
  const previous = getConfig()
  if (app.isPackaged && process.platform === 'win32' && previous.common.autoLaunch !== next.common.autoLaunch) {
    app.setLoginItemSettings({ openAtLogin: next.common.autoLaunch, args: ['--hidden'],
    })
  }
  fs.mkdirSync(app.getPath('userData'), { recursive: true,
  })
  fs.writeFileSync(`${configPath()}.tmp`, JSON.stringify(next, null, 2))
  fs.renameSync(`${configPath()}.tmp`, configPath())
  config = next
  return getConfig()
}
