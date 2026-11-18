import { contextBridge, ipcRenderer } from 'electron'

const events = new Set(['refresh-chart', 'window.maximize'])
const invokes = new Set([
  'titleBarControl:minimize',
  'titleBarControl:maximizeOrUnmaximize',
  'titleBarControl:close',
  'usageData:day',
  'usageData:hour',
  'usageData:OneHour',
  'usageData:range',
  'usageData:year',
  'getAppInfo',
  'settings:get',
  'settings:save',
  'categories:list',
  'categories:save',
  'categories:delete',
  'apps:update',
  'data:export',
  'data:import',
  'data:folder',
  'app:version',
])
const listeners = new Map<string, Map<(...args: any[]) => void, (...args: any[]) => void>>()
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void) {
    if (!events.has(channel))
      throw new Error('Unsupported event')
    const channelListeners = listeners.get(channel) ?? new Map()
    if (channelListeners.has(listener))
      return
    const wrapped = (_event: unknown, ...args: unknown[]) => listener(null, ...args)
    channelListeners.set(listener, wrapped)
    listeners.set(channel, channelListeners)
    ipcRenderer.on(channel, wrapped)
  },
  off(channel: string, listener: (...args: any[]) => void) {
    const wrapped = listeners.get(channel)?.get(listener)
    if (wrapped)
      ipcRenderer.off(channel, wrapped)
    listeners.get(channel)?.delete(listener)
  },
  send(channel: string, ...args: unknown[]) {
    if (channel !== 'open-url')
      throw new Error('Unsupported channel')
    ipcRenderer.send(channel, ...args)
  },
  invoke(channel: string, ...args: unknown[]) {
    if (!invokes.has(channel))
      throw new Error('Unsupported channel')
    return ipcRenderer.invoke(channel, ...args)
  },
})

// --------- Preload scripts loading ---------
function domReady(
  condition: DocumentReadyState[] = ['complete', 'interactive'],
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    }
    else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}
