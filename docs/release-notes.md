## TaiM 0.0.1

- 修复部分 Windows 应用显示通用图标的问题。
- 网站停留时间默认按域名汇总，可展开查看各页面。
- 应用详情新增使用趋势：单日按小时、短日期范围按天、长日期范围按月。
- 分类页支持多选、批量归类和拖放归类。
- 新增 macOS Apple 芯片版和 Linux x64 构建包。

### 下载与安装

- Windows x64：`TaiM-Windows-0.0.1-Setup.exe`。可覆盖安装 beta 版；应用内检查、后台下载及确认安装仍仅适用于 Windows 安装版。
- macOS Apple 芯片：`TaiM-Mac-0.0.1-Installer.dmg`。此版未签名，也未在真实 Mac 上验证运行。
- Linux x64：`TaiM-Linux-0.0.1.AppImage`。前台窗口统计依赖 X11 和系统的 `xprop`、`xwininfo`；Wayland 不受支持。此版尚未在真实 Linux 桌面上验证运行。

数据保存在各自电脑本机。首次升级前可在“设置 → 数据”导出 JSON 备份。Windows 安装包未签名，安装时可能出现系统信誉提示。

### 网站扩展

Windows 上可使用“网站 → 使用说明 / 扩展下载”中的内置扩展，或下载 `TaiM-Browser-Extension.zip` 并在 Chrome / Edge 中加载。扩展 ZIP 不包含个人配对密钥。macOS 与 Linux 的浏览器连接尚未验证，请以应用内提示为准。

Release 同时提供 Windows 更新描述文件、blockmap 和涵盖所有发布附件的 `SHA256SUMS.txt`。自动更新所需文件请保留。
