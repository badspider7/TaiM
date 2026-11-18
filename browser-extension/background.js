/* global chrome, importScripts */
importScripts('connection.js')

const client = crypto.randomUUID()
let sequence = 0
let busy = false
let rerun = false

async function report() {
  if (busy) {
    rerun = true
    return
  }
  busy = true
  try {
    const win = await chrome.windows.getLastFocused({ populate: true })
    const tab = win.tabs?.find(tab => tab.active)
    const focused = !!(win.focused && !win.incognito && tab && !tab.incognito && /^https?:\/\//i.test(tab.url ?? ''))
    const response = await fetch(`http://127.0.0.1:${globalThis.TAIM_CONNECTION.port}/v1/activity`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${globalThis.TAIM_CONNECTION.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, sequence: sequence++, browser: /Edg\//.test(navigator.userAgent) ? 'edge' : 'chrome', focused, url: focused ? tab.url : '', title: focused ? (tab.title ?? '').slice(0, 512) : '' }),
      signal: AbortSignal.timeout(1800),
    })
    if (!response.ok)
      throw new Error(`HTTP ${response.status}`)
    await chrome.action.setBadgeText({ text: '' })
    await chrome.action.setTitle({ title: 'TaiM 网站计时：已连接本机 TaiM' })
  }
  catch {
    await chrome.action.setBadgeText({ text: '!' })
    await chrome.action.setTitle({ title: 'TaiM 未连接：请启动 TaiM 并在网站页面开启计时' })
  }
  finally {
    busy = false
    if (rerun) {
      rerun = false
      void report()
    }
  }
}

chrome.tabs.onActivated.addListener(() => void report())
chrome.tabs.onUpdated.addListener((_id, change) => {
  if (change.url || change.title || change.status === 'complete')
    void report()
})
chrome.tabs.onRemoved.addListener(() => void report())
chrome.windows.onFocusChanged.addListener(() => void report())
chrome.alarms.onAlarm.addListener(() => void report())
chrome.runtime.onStartup.addListener(() => void report())
chrome.runtime.onInstalled.addListener(() => void report())
// API calls and requests keep the MV3 worker active; alarms recover after suspension.
void chrome.alarms.create('taim-reconnect', { periodInMinutes: 0.5 })
setInterval(() => void report(), 1000)
void report()
