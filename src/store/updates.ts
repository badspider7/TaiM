import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UpdateState } from '@@/update/types'

export const useUpdates = defineStore('updates', () => {
  const state = ref<UpdateState>({
    revision: -1,
    enabled: false,
    phase: 'idle',
    currentVersion: '',
    availableVersion: '',
    releaseDate: '',
    releaseNotes: '',
    percent: 0,
    transferred: 0,
    total: 0,
    bytesPerSecond: 0,
    checkedAt: '',
    message: '正在读取更新状态…',
  })
  let listening = false
  function receive(_event: unknown, next: UpdateState) {
    if (next.revision >= state.value.revision)
      state.value = next
  }
  async function initialize() {
    if (listening)
      return
    listening = true
    window.ipcRenderer.on('updater:state', receive)
    await command('updater:get')
  }
  function dispose() {
    if (listening)
      window.ipcRenderer.off('updater:state', receive)
    listening = false
  }
  async function command(channel: string) {
    try {
      receive(null, await window.ipcRenderer.invoke(channel))
    }
    catch { state.value = { ...state.value, phase: 'error', message: '无法调用更新服务，请重启 TaiM 后重试' } }
  }
  return { state, initialize, dispose, command }
})
