/* global chrome */
const input = document.querySelector('#token')
const status = document.querySelector('#status')
const button = document.querySelector('button')

async function initialize() {
  try {
    const saved = await chrome.storage.local.get('taimToken')
    input.value = saved.taimToken || globalThis.TAIM_CONNECTION.token || ''
    if (input.value)
      status.textContent = '已配置本机配对码。需要更换时重新粘贴保存。'
  }
  catch { status.textContent = '读取配对信息失败，请重新打开扩展。' }
}
document.querySelector('#pair-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const token = input.value.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(token)) {
    status.textContent = '配对码应为 64 位字符，请从 TaiM 的使用说明页面重新复制。'
    return
  }
  button.disabled = true
  try {
    await chrome.storage.local.set({ taimToken: token })
    status.textContent = '配对码已保存，请回到 TaiM 确认“扩展已连接”。'
  }
  catch { status.textContent = '保存失败，请重试。' }
  finally { button.disabled = false }
})
void initialize()
