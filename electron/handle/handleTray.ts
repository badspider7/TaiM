import path from 'node:path'
import type { BrowserWindow } from 'electron'
import { Menu, Tray, app, nativeImage } from 'electron'

let tray: Tray | undefined

export function setupTray(win: BrowserWindow): void {
  tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'logo.ico')))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '   显示   ',
      click: () => {
        if (win.isMinimized())
          win.restore()
        win?.show()
        win.focus()
      },
    },
    {
      label: '   退出   ',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('TaiM')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win.show()
  })
}
