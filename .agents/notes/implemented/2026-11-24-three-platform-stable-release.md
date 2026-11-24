# 三平台安装包与正式版发布

Status: implemented

## 问题

原发布工作流只在 Windows runner 构建 NSIS 安装包。版本号 `0.0.1-beta.4` 带预发布后缀，发布任务据此将 GitHub Release 标为 Pre-release。现需提供三个桌面平台的包，并发布正式版。

## 决定

发布仍由与 `package.json` 版本一致的 `v` 标签触发。Windows、macOS Apple 芯片和 Linux x64 分别在本机架构的 runner 构建 NSIS、DMG 和 AppImage；三个构建都成功且附件存在后，合并校验文件并公开 Release。工作流也可从主分支手动运行，传入已有 `release_tag` 以重新构建同一标签。版本带预发布后缀时标为 Pre-release，无后缀时标为 Release。当前正式版本为 `0.0.1`。Windows 的 `latest.yml` 和 blockmap 保持原样，继续供应用内更新使用。

## 考虑过的替代方案

- 在一个 Windows runner 交叉构建三个平台。可以少设矩阵任务，但 SQLite 原生模块需要针对目标系统编译，产物难以保证可运行。
- 只构建 Windows 包、把现有预发布改成正式版。能消除 Pre-release 标记，但仍无法满足三个平台打包。
- 用 `electron-builder` 直接发布每个平台的产物。可减少上传步骤，但无法在三个平台全部构建成功后统一核对附件和公开 Release。

## 影响与代价

发布耗时和 CI 资源增加；任一平台失败将阻止正式发布。macOS/Linux 暂未做真实设备运行验证，且不支持应用内自动更新；Linux 前台统计依赖 X11、`xprop` 和 `xwininfo`。原有 Windows 更新机制不变。此决定补充 [Windows 后台下载决定](2026-11-19-background-update-download.md)，不替代其更新行为。

## 涉及文件

- [release.yml](../../../.github/workflows/release.yml) 构建三个平台、核对附件、生成统一 SHA256 文件并依据版本类型发布。
- [rebuild.js](../../../rebuild.js) 在所有平台重建 SQLite，仅在 Windows 准备 get-windows 的 Windows 二进制。
- [package.json](../../../package.json)、[releaseHistory.ts](../../../electron/const/releaseHistory.ts) 设置稳定版本及离线更新说明。
- [index.ts](../../../electron/update/index.ts) 对 macOS/Linux 安装包说明需手动更新。
- [README.md](../../../README.md)、[release-notes.md](../../../docs/release-notes.md)、[updates.md](../../../docs/updates.md) 说明安装包、版本规则及平台限制。

## 验证与限制

本地 `pnpm lint`、`pnpm build`、`pnpm test` 通过。`v0.0.1` 首次运行中三个平台构建均成功，但发布任务因通配上传路径保留版本子目录而未通过；已将矩阵上传路径改为明确版本目录，待重新验证。真实设备安装结果待验证。

## 提交追踪

- 实现提交：`6ba8170fe2b83636af29b08e69111c0e961796f2`。
- 发布路径修正提交：`9f056c6c229ef74a177b4c4622353afc85bb5204`。
- 基准 `HEAD`：`10bd859b84324bc61786f4791e78c5518eb56e48`。
