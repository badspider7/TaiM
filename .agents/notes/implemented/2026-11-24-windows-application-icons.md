# Windows 应用图标来源与缺失回退

Status: implemented

## 问题

Electron 的 `getFileIcon` 有时把有内嵌图标的 exe 显示为通用程序图标。Windows 打包应用的图标也可能位于 `AppxManifest.xml` 指定的资源中，而不在 exe 内。启动时刷新图标缓存会把此类通用图标继续保存到数据库。

## 决定

Windows 上优先读取与 exe 对应的包清单图标，其次读取 exe 的内嵌图标。没有真实图标的可执行文件保存空图标，由现有应用行展示名称首字。其他平台和非 exe 文件仍使用 Electron 图标接口。启动和恢复备份时刷新仍存在的程序图标；原文件不存在或提取过程失败时保留数据库中的旧图标。图标继续作为数据 URL 存入原字段，数据库与备份格式不变。

## 考虑过的替代方案

- 继续使用 `getFileIcon`：无法修复本机 Emdash.exe 被识别成通用图标的问题。
- 按应用名内置品牌图标：同名进程可能来自不同安装包，也无法覆盖未知应用。
- 直接引用磁盘图标路径：程序更新或卸载后路径会失效，且无法保持现有备份的图标数据格式。

## 影响与代价

首次发现应用和启动刷新时会为每个未缓存的 exe 调用一次隐藏的 PowerShell 进程，增加少量等待。无内嵌图标或包资源的程序只能展示名称首字；例如本机的 Codex 命令行进程没有可提取的图标。现有使用时长与分类不变。

## 涉及文件

- [appIcons.ts](../../../electron/utils/appIcons.ts) 读取 Windows 内嵌图标和包资源，缓存结果并刷新已保存图标。
- [integration.mjs](../../../tests/integration.mjs) 验证无图标 exe、包资源、高清图标和数据库刷新。
- [记录索引](../README.md) 收录本决定。

## 验证与限制

`pnpm lint`、`pnpm typecheck`、`pnpm build` 和 `pnpm test` 已通过。本机额外验证 Emdash.exe 输出内嵌图标、SearchHost.exe 输出包图标、无图标的 codex.exe 返回空图标。未验证其他 Windows 版本的全部包清单格式。

## 提交追踪

- 实现提交：`4f6cb702a927db08b8427fde9f255c60cc98a610`。
- 基准 `HEAD`：`8f154286ceefcb1289dbd1e7e13f00663de7c831`。

相关的[概览时长与排行记录](2026-11-19-readable-usage-metrics.md)及[桌面主题与共享应用行记录](2026-11-19-desktop-layout-and-theme.md)仍有效；本决定只调整图标数据的来源。
