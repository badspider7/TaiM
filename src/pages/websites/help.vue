<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import { Button } from '@/components/ui/button'

const busy = ref(false)
const enabled = ref(false)
const message = ref('')
const error = ref('')
const activeAction = ref('')
async function run(action: string) {
  if (busy.value)
    return
  busy.value = true
  activeAction.value = action
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
  <div>
    <PageHeading title="网站计时使用说明">
      <template #actions>
        <router-link to="/websites" class="action-button">
          返回网站记录
        </router-link>
      </template>
    </PageHeading>
    <div class="website-help">
      <section class="surface help-step">
        <h2>1. 开启网站计时</h2>
        <p>需要 Chrome / Edge 120 或更新版本，并保持 TaiM 在后台运行。</p>
        <Button size="sm" :variant="enabled ? 'outline' : 'default'" :disabled="busy" @click="run('enable')">
          {{ enabled ? '暂停网站计时' : '开启网站计时' }}
        </Button>
        <p v-if="error && (!activeAction || activeAction === 'enable')" role="alert" class="error-message">
          {{ error }}
        </p>
      </section>
      <section class="surface help-step">
        <h2>2. 获取浏览器扩展</h2>
        <p>使用安装包内置的扩展，无需另外下载，已自动配对本机 TaiM。</p>
        <Button size="sm" :disabled="busy" @click="run('extension')">
          准备 / 打开内置扩展目录
        </Button>
        <p v-if="message && activeAction === 'extension'" role="status" class="text-sm break-all">
          {{ message }}
        </p>
        <p v-if="error && activeAction === 'extension'" role="alert" class="error-message">
          {{ error }}
        </p>
        <p>也可从 Releases 下载同版本附件 TaiM-Browser-Extension.zip，解压到固定目录。通用下载包不含个人配对码。</p>
        <Button size="sm" variant="outline" @click="download">
          扩展下载（Releases）
        </Button>
        <p class="text-sm text-muted-foreground">
          此附件随新版发布；若当前 Release 没有该文件，请使用上面的内置扩展。
        </p>
      </section>
      <section class="surface help-step">
        <h2>3. 加载扩展</h2>
        <ol>
          <li>Chrome 地址栏输入 chrome://extensions；Edge 输入 edge://extensions。</li>
          <li>开启“开发者模式”，点击“加载已解压的扩展”。</li>
          <li>选择上一步的扩展目录；如果下载了 ZIP，先解压，选择包含 manifest.json 的目录。</li>
        </ol>
      </section>
      <section class="surface help-step">
        <h2>4. 配对与验证</h2>
        <p>内置扩展会自动配对。通用下载包请先复制配对码，点击工具栏里的 TaiM 扩展图标，粘贴后保存。</p>
        <Button size="sm" variant="outline" :disabled="busy" @click="run('pair')">
          复制本机配对码
        </Button>
        <p v-if="message && activeAction === 'pair'" role="status" class="text-sm">
          {{ message }}
        </p>
        <p v-if="error && activeAction === 'pair'" role="alert" class="error-message">
          {{ error }}
        </p>
        <p>返回“网站”，确认“扩展已连接”。前台浏览网页十几秒后查询 / 刷新，即可看到标题、网址和时长。</p>
      </section>
      <details class="surface help-step">
        <summary>计时规则与页面标题</summary>
        <p>只计系统前台浏览器的当前标签页；后台、无痕、浏览器内部页面、空闲、锁屏及休眠不计时。约每秒采样，断连后最多 2.5 秒停止，不补计浏览历史。</p>
        <p>默认按网站域名汇总停留时间，点击页面数量可查看具体网址。具体网址显示所选日期内最近的非空小时标题；标题会随网页更新，同一网址在同一小时内仅保留最后记录的标题。无标题时显示“未命名页面”。汇总中的“主要页面”指停留时间最长的页面。</p>
        <p>网站时间是浏览器使用时间的细分，不会重复加进应用总时长。</p>
      </details>
      <details class="surface help-step">
        <summary>隐私、更新与连接故障</summary>
        <p>标题可能包含搜索词、聊天对象或文档名，网址查询参数也可能包含敏感信息。记录和配对码只保存在本机，不上传；导出的 JSON / CSV 含标题和网址，请按个人数据保管。</p>
        <p>配对码保存在本机扩展存储中，不通过浏览器同步。勿分享配对码或自动配对后的内置扩展目录。公开下载的通用 ZIP 不含本机密钥。</p>
        <p>更新扩展后，在扩展管理页点击“重新加载”。每个浏览器配置文件需要单独加载和配对，勿在同一配置文件重复安装两份。</p>
        <p>无法连接时，检查是否开启网站计时、TaiM 是否运行、配对码是否正确，或本机端口 17384 是否被占用。换电脑需重新配对。</p>
      </details>
    </div>
  </div>
</template>

<style scoped>
.website-help { display: grid; gap: 12px; max-width: 900px; }
.help-step { padding: 16px; }
h2 { font-size: 15px; font-weight: 600; }
p, ol { margin: 10px 0; line-height: 1.7; }
.help-step > :last-child { margin-bottom: 0; }
ol { list-style: decimal; padding-left: 24px; }
summary { cursor: pointer; font-weight: 600; }
</style>
