# 项目指南

## 项目概览

TaiM 是 Windows 桌面时间统计工具，记录前台应用使用时间，并可通过 Chrome / Edge 扩展统计前台网站。数据保存在本机 SQLite；应用支持空闲暂停、分类、统计视图、备份恢复和 Windows 安装版更新。功能及使用方式以 [README](README.md) 为准。

技术栈为 Electron、Vue 3、TypeScript、Vite、Pinia、Tailwind CSS 和 better-sqlite3。主进程通过 preload 暴露的 IPC 与渲染进程通信。

## 目录结构

- `electron/main/`：Electron 主进程入口和应用生命周期；`electron/preload/`：渲染进程桥接。
- `electron/handle/`：IPC 处理；`electron/db/`：SQLite 数据、表和备份；`electron/utils/`：应用计时等工具。
- `electron/browser/`：网站跟踪与扩展连接；`electron/update/`：应用更新。
- `src/pages/`：各功能页面；`src/components/`：共享组件；`src/store/`、`src/router/`、`src/api/`：状态、路由及接口。
- `browser-extension/`：浏览器扩展；`tests/`：集成和功能测试；`scripts/`：打包与专项验证脚本。
- `docs/`：网站扩展、更新和发布等说明。`dist/`、`dist-electron/`、`dist-native/`、`release/` 为构建或打包产物。

## 开发与验证

在 Windows x64 上使用 Node.js 20+ 和 pnpm。依赖安装、原生模块重建及启动步骤见 [README](README.md)。常用命令：

- `pnpm dev`：启动开发环境；`pnpm run rebuild`：为 Electron 重建 SQLite 原生模块。
- `pnpm lint`：静态检查；`pnpm build`：类型检查和生产构建。
- `pnpm test`：先执行 `pnpm build`，再运行测试；测试使用独立临时数据库。
- `pnpm verify:browser`：验证浏览器扩展；发布与安装包验证见 [更新说明](docs/updates.md)。

涉及计时、数据库、备份或浏览器连接时，保持本地数据和既有行为兼容，并运行相关测试。开发数据库为项目根目录的 `sqlite3.db`；不要把用户数据或生成产物纳入提交。

## 决策记录

修改相关模块前，查找 `.agents/notes/` 中涉及该模块的记录。重要决策在同一次变更中创建或更新，遵循 [记录规则](.agents/notes/README.md)；普通修复和机械调整不必单独记录。

新增决策时同步审查相关旧记录；路径、配置或实现事实变化时同步更新相关已实施记录。日常维护按项目规则执行，无需每次显式调用初始化 skill。
