import path from 'node:path'
import type { BrowserWindow } from 'electron'
import { Menu, Tray, app, nativeImage } from 'electron'

export function setupTray(win: BrowserWindow): void {
  const tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_IMAGE_PATH, 'Pumpkin.png')))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '   显示   ',
      click: () => {
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
  tray.on('double-click', () => {
    win.show()
  })
}
