<script setup lang="ts">
import { onMounted, ref } from 'vue'

const busy = ref(false)
const enabled = ref(false)
const message = ref('')
const error = ref('')
async function run(action: string) {
  if (busy.value)
    return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    if (action === 'enable') {
      const status = await window.ipcRenderer.invoke('websites:enable', !enabled.value)
      enabled.value = status.enabled
    }
    else if (action === 'extension') {
      message.value = `已准备本机配对扩展，加载此目录：${await window.ipcRenderer.invoke('websites:extension')}`
    }
    else if (action === 'pair') {
      await window.ipcRenderer.invoke('websites:pair')
      message.value = '配对码已复制。点击浏览器工具栏中的 TaiM 扩展图标，粘贴后保存。'
    }
  }
  catch (e) { error.value = String(e) }
  finally { busy.value = false }
}
onMounted(async () => {
  try {
    enabled.value = (await window.ipcRenderer.invoke('websites:status')).enabled
  }
  catch (e) { error.value = String(e) }
})
function download() {
  window.ipcRenderer.send('open-url', 'https://github.com/badspider7/TaiM/releases')
}
</script>

<template>
  <div class="page-scroll website-help">
    <router-link to="/websites" class="text-sm text-muted-foreground underline">
      ← 返回网站记录
    </router-link>
    <h1 class="text-lg mt-4 mb-5">
      网站计时使用说明
    </h1>
    <h2>1. 开启网站计时</h2>
    <p>需要 Chrome / Edge 120 或更新版本，并保持 TaiM 在后台运行。</p>
    <button class="action-button" :disabled="busy" @click="run('enable')">
      {{ enabled ? '暂停网站计时' : '开启网站计时' }}
    </button>
    <h2>2. 获取浏览器扩展</h2>
    <p>使用安装包内置的扩展，无需另外下载，已自动配对本机 TaiM。</p>
    <button class="action-button" :disabled="busy" @click="run('extension')">
      准备 / 打开内置扩展目录
    </button>
    <p>也可从 Releases 下载同版本附件 TaiM-Browser-Extension.zip，解压到固定目录。通用下载包不含个人配对码。</p>
    <button class="action-button" @click="download">
      扩展下载（Releases）
    </button>
    <p class="text-sm text-muted-foreground">
      此附件随新版发布；若当前 Release 没有该文件，请使用上面的内置扩展。
    </p>
    <h2>3. 加载扩展</h2>
    <ol>
      <li>Chrome 地址栏输入 chrome://extensions；Edge 输入 edge://extensions。</li>
      <li>开启“开发者模式”，点击“加载已解压的扩展”。</li>
      <li>选择上一步的扩展目录；如果下载了 ZIP，先解压，选择包含 manifest.json 的目录。</li>
    </ol>
    <h2>4. 配对与验证</h2>
    <p>内置扩展会自动配对。通用下载包请先复制配对码，点击工具栏里的 TaiM 扩展图标，粘贴后保存。</p>
    <button class="action-button" :disabled="busy" @click="run('pair')">
      复制本机配对码
    </button>
    <p>返回“网站”，确认“扩展已连接”。前台浏览网页十几秒后查询 / 刷新，即可看到标题、网址和时长。</p>
    <p v-if="message" role="status" class="text-sm break-all">
      {{ message }}
    </p>
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
    <details>
      <summary>计时规则与页面标题</summary>
      <p>只计系统前台浏览器的当前标签页；后台、无痕、浏览器内部页面、空闲、锁屏及休眠不计时。约每秒采样，断连后最多 2.5 秒停止，不补计浏览历史。</p>
      <p>具体网址显示所选日期内最近的非空小时标题；标题会随网页更新，同一网址在同一小时内仅保留最后记录的标题。无标题时显示“未命名页面”。域名汇总中的“主要页面”指停留时间最长的页面，可点击页面数量查看明细。</p>
      <p>网站时间是浏览器使用时间的细分，不会重复加进应用总时长。</p>
    </details>
    <details>
      <summary>隐私、更新与连接故障</summary>
      <p>标题可能包含搜索词、聊天对象或文档名，网址查询参数也可能包含敏感信息。记录和配对码只保存在本机，不上传；导出的 JSON / CSV 含标题和网址，请按个人数据保管。</p>
      <p>配对码保存在本机扩展存储中，不通过浏览器同步。勿分享配对码或自动配对后的内置扩展目录。公开下载的通用 ZIP 不含本机密钥。</p>
      <p>更新扩展后，在扩展管理页点击“重新加载”。每个浏览器配置文件需要单独加载和配对，勿在同一配置文件重复安装两份。</p>
      <p>无法连接时，检查是否开启网站计时、TaiM 是否运行、配对码是否正确，或本机端口 17384 是否被占用。换电脑需重新配对。</p>
    </details>
  </div>
</template>

<style scoped>
.website-help { max-width: 1000px; }
h2 { font-weight: 600; margin-top: 24px; margin-bottom: 10px; }
p, ol { margin: 12px 0; line-height: 1.7; }
ol { list-style: decimal; padding-left: 24px; }
details { margin-top: 24px; }
summary { cursor: pointer; font-weight: 600; }
</style>
