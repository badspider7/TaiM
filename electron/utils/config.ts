// import path from 'node:path'
// import fs from 'node:fs'
// import { Conf } from 'electron-conf/main'
// import { app } from 'electron'
// import defaultConfigForAnyPlatform from '../const/defaultConfig'

// const schema = {
//   type: 'object',
//   properties: {
//     version: {
//       type: 'number',
//       nullable: true,
//     },
//     common: {
//       type: 'object',
//       properties: {
//         autoLaunch: {
//           type: 'boolean',
//           default: false,
//         },
//         keepWindowSize: {
//           type: 'boolean',
//           default: false,
//         },
//         lang: {
//           type: 'string',
//           default: 'zh-CN',
//         },
//         theme: {
//           type: 'string',
//           default: 'light',
//         },
//       },
//     },
//     actions: {
//       type: 'object',
//       properties: {},
//     },
//     data: {
//       type: 'object',
//       properties: {},
//     },
//   },
// }

// const configPath = path.join(app.getPath('userData'), 'config.json')
// const cofigObj = fs.readFileSync(configPath, 'utf-8')
// export function initConfig() {
//   const conf = new Conf({ schema })

//   if (!fs.existsSync(configPath) || conf.store.size === 0 || !conf.has('version')) {
//     // 如果文件不存在或conf实例为空，则设置默认配置
//     conf.set(defaultConfigForAnyPlatform)
//   }
//   conf.registerRendererListener()
// }
