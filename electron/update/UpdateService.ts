import type { AppUpdater, UpdateInfo } from 'electron-updater'
import type { UpdateStage, UpdateState } from './types'

interface Options {
  currentVersion: string
  disabledReason?: string
  notify: (state: UpdateState) => void
  beforeInstall: () => void
  installFailed: () => void
  logError: (error: unknown) => void
}

export function releaseNotesText(notes: UpdateInfo['releaseNotes']): string {
  const text = Array.isArray(notes) ? notes.map(n => `${n.version}\n${n.note ?? ''}`).join('\n\n') : notes ?? ''
  // GitHub can return HTML. Render only text in the UI, never executable markup.
  return text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').trim().slice(0, 50000)
}

function failureMessage(error: unknown, stage: UpdateStage) {
  const message = String(error)
  if (/ERR_UPDATER_(?:NO_PUBLISHED_VERSIONS|CHANNEL_FILE_NOT_FOUND|LATEST_VERSION_NOT_FOUND)|404/.test(message))
    return '发布源中尚无可用更新或缺少更新文件，请稍后重试或查看发布页面。'
  if (/sha512|checksum|signature/i.test(message))
    return '更新文件校验失败，请重新下载或前往发布页面。'
  if (/ENOTFOUND|ECONN|ETIMEDOUT|net::|network|timeout/i.test(message))
    return '无法连接更新服务，请检查网络后重试。'
  return `${stage === 'check' ? '检查更新' : stage === 'download' ? '下载更新' : '安装更新'}失败，请重试或前往发布页面手动下载。`
}

export class UpdateService {
  private state: UpdateState
  private stage: UpdateStage = 'check'

  constructor(private client: AppUpdater | undefined, private options: Options) {
    this.state = {
      revision: 0,
      enabled: !!client,
      phase: client ? 'idle' : 'disabled',
      currentVersion: options.currentVersion,
      availableVersion: '',
      releaseDate: '',
      releaseNotes: '',
      percent: 0,
      transferred: 0,
      total: 0,
      bytesPerSecond: 0,
      checkedAt: '',
      message: client ? '可以检查是否有新版本' : options.disabledReason ?? '自动更新暂不可用',
    }
    if (!client)
      return
    client.autoDownload = false
    client.autoInstallOnAppQuit = false
    // Beta builds can receive beta and stable releases; stable builds stay on stable.
    client.allowPrerelease = options.currentVersion.includes('-')
    client.allowDowngrade = false
    client.fullChangelog = true
    client.disableWebInstaller = true
    client.on('update-available', info => this.change({
      ...this.info(info),
      phase: 'available',
      message: `发现新版本 ${info.version}`,
      checkedAt: new Date().toISOString(),
    }))
    client.on('update-not-available', () => this.change({
      phase: 'not-available',
      message: '当前已是最新版本',
      checkedAt: new Date().toISOString(),
      availableVersion: '',
      releaseNotes: '',
      releaseDate: '',
    }))
    client.on('download-progress', progress => this.change({
      phase: 'downloading',
      percent: Math.max(0, Math.min(100, progress.percent)),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
      message: '正在下载更新，可继续使用 TaiM',
    }))
    client.on('update-downloaded', info => this.change({
      ...this.info(info),
      phase: 'downloaded',
      percent: 100,
      message: '更新已下载，点击“重启并安装”完成更新',
    }))
    client.on('error', error => this.fail(error))
  }

  snapshot(): UpdateState { return { ...this.state } }

  private info(info: UpdateInfo) {
    return { availableVersion: info.version, releaseDate: info.releaseDate ?? '', releaseNotes: releaseNotesText(info.releaseNotes) }
  }

  private change(patch: Partial<UpdateState>) {
    this.state = { ...this.state, ...patch, revision: this.state.revision + 1 }
    this.options.notify(this.snapshot())
  }

  private fail(error: unknown) {
    this.options.logError(error)
    if (this.state.phase === 'installing')
      this.options.installFailed()
    this.change({ phase: 'error', failedStage: this.stage, message: failureMessage(error, this.stage) })
  }

  async check() {
    if (!this.client || ['checking', 'downloading', 'downloaded', 'installing'].includes(this.state.phase))
      return this.snapshot()
    this.stage = 'check'
    this.change({ phase: 'checking', message: '正在检查更新…', failedStage: undefined, percent: 0 })
    try {
      const result = await this.client.checkForUpdates()
      if (!result && this.state.phase === 'checking')
        throw new Error('更新服务未启用')
    }
    catch (error) { this.fail(error) }
    return this.snapshot()
  }

  async download() {
    if (!this.client || !(this.state.phase === 'available' || (this.state.phase === 'error' && this.state.failedStage === 'download')))
      return this.snapshot()
    this.stage = 'download'
    this.change({ phase: 'downloading', message: '正在下载更新…', failedStage: undefined, percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 })
    try {
      await this.client.downloadUpdate()
    }
    catch (error) { this.fail(error) }
    return this.snapshot()
  }

  install() {
    if (!this.client || this.state.phase !== 'downloaded')
      return this.snapshot()
    this.stage = 'install'
    this.change({ phase: 'installing', message: '正在保存统计数据并启动安装程序…', failedStage: undefined })
    try {
      this.options.beforeInstall()
      this.client.quitAndInstall(false, true)
    }
    catch (error) { this.fail(error) }
    return this.snapshot()
  }
}
