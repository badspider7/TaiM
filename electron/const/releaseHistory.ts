// Keep the local history available even when the update server cannot be reached.
export const releaseHistory = [
  {
    version: '0.0.1-beta.2',
    date: '2026-11-18',
    title: '首个公开测试版',
    notes: [
      '新增应用分类、别名、日期范围查询与逐日使用记录。',
      '新增 JSON 备份恢复、CSV 导出，恢复前自动备份原数据库。',
      '新增主题切换、窗口大小记忆、忽略应用和空闲阈值设置。',
      '修复休眠负数时长、跨小时与跨天统计、退出缓存保存和图表资源释放。',
      '接入 Windows 安装版更新检查、手动下载、下载进度与重启安装。',
      '新增应用内本地更新日志和远程新版本说明。',
    ],
  },
]
