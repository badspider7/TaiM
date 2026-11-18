import { defineStore } from 'pinia'
import { ref } from 'vue'
import defaults, { type IConfig } from '@@/const/defaultConfig'

export const useSettings = defineStore('settings', () => {
  const config = ref<IConfig>(structuredClone(defaults))
  const autoLaunchAvailable = ref(false)
  const error = ref('')
  const busy = ref(false)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  function applyTheme() {
    document.documentElement.classList.toggle('dark', config.value.common.theme === 'dark' || (config.value.common.theme === 'system' && media.matches))
  }
  media.addEventListener('change', applyTheme)
  async function load() {
    try {
      const result = await window.ipcRenderer.invoke('settings:get')
      config.value = result.config
      autoLaunchAvailable.value = result.autoLaunchAvailable
      applyTheme()
    }
    catch (e) {
      error.value = String(e)
    }
  }
  async function save() {
    if (busy.value)
      return
    busy.value = true
    error.value = ''
    try {
      config.value = await window.ipcRenderer.invoke('settings:save', JSON.parse(JSON.stringify(config.value)))
      applyTheme()
    }
    catch (e) {
      error.value = String(e)
      await load()
    }
    finally {
      busy.value = false
    }
  }
  return { config, autoLaunchAvailable, error, busy, load, save,
  }
})
