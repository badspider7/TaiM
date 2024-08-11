import path from 'node:path'
import type { BrowserWindow } from 'electron'
import { Menu, Tray, app, nativeImage } from 'electron'

export function setupTray(win: BrowserWindow): void {
  // TODO: bug 不显示
  const tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_IMAGE_PATH, 'tray_icon.png')))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '   显示   ',
      click: () => {
        win?.minimize()
        win?.show()
      },
    },
    {
      label: '   退出   ',
      click: () => {
        app.exit()
      },
    },
  ])

  tray.setToolTip('TaiM')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win.show()
  })
}
