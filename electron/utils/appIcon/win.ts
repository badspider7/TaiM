import { access, constants, mkdir, writeFile as writeFilePromise } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const fileIcon = require('extract-file-icon')

const icondir = path.join(process.cwd(), 'AppIcons')

export async function getWinIco(appInfo) {
  try {
    await mkdir(icondir, { recursive: true }).catch((err) => {
      if (err.code !== 'EEXIST')
        throw err
    })

    const buffer = fileIcon(appInfo.path, 32)
    const iconpath = path.join(icondir, `${appInfo.name}.png`)

    try {
      await access(iconpath, constants.W_OK)
    }
    catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
      await writeFilePromise(iconpath, buffer)
    }
  }
  catch (e) {
    console.error(e, appInfo.path)
  }
}
