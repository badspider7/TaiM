# 自动更新与更新日志

## 应用行为

- 支持 Windows NSIS 安装版。开发模式明确提示不可用，避免覆盖开发环境。
- 默认启动 10 秒后检查一次，可在“设置 → 关于”关闭，也可手动检查。
- 发现更新时显示提示，点击“查看更新”进入关于页；不会自动下载或静默安装。
- 下载显示百分比、已下载大小和速度。下载完成后由用户点击“重启并安装”。普通关闭或退出不会触发安装。
- 安装前停止采样并保存缓存；保存失败则阻止安装并恢复计时。安装启动失败会恢复应用退出行为及计时。
- 网络、发布文件缺失和校验失败显示明确错误，可重试或前往 GitHub 发布页面。
- beta 版本允许接收 beta 和正式版；正式版仅接收正式版，禁止降级。
- 本地开发日志来自 `electron/const/releaseHistory.ts`，离线可读；检查到新版后额外展示远程说明。远程内容以文本展示，不执行 HTML。

## 发布准备

更新源对应当前 Git 远程仓库：`badspider7/TaiM` 的 GitHub Releases。构建时由 electron-builder 生成 `resources/app-update.yml`；应用不硬编码安装包 URL，也不携带 GitHub Token。

1. 修改 `package.json` 的版本号，确保高于旧安装版，例如 `0.0.2-beta.1`。
2. 在 `electron/const/releaseHistory.ts` 顶部追加固定版本的本地日志，保留旧条目；同步更新 `docs/release-notes.md`。
3. 运行 `pnpm lint`、`pnpm build`、`pnpm test`。
4. 提交版本改动，推送到 GitHub，然后推送相同版本标签，例如：

   ```sh
   git push origin main
   git tag -a v0.0.2-beta.1 -m "TaiM 0.0.2-beta.1"
   git push origin v0.0.2-beta.1
   ```

5. `.github/workflows/release.yml` 在 Windows CI 中重新安装依赖、准备原生模块、执行检查与测试、构建 NSIS 安装包，并验证安装包校验值与更新描述匹配。
6. 发布任务先建立草稿，上传 `.exe`、`.exe.blockmap`、`latest.yml`、`SHA256SUMS.txt`，成功后公开发布；带预发布后缀的版本会标为 prerelease。无需额外 PAT，使用仓库内置 `GITHUB_TOKEN`，仅发布任务有 `contents: write` 权限。
7. 工作流支持手动重跑，需选择对应版本标签。重复执行会更新同一 Release 的构建产物；不要修改已安装版本的含义，后续功能改动应增加版本号并使用新标签。

`pnpm release:win` 仍仅在本地构建，不上传；发布工作由 CI 统一完成。GitHub provider 使用实际生成的 `latest.yml`，不要手动修改其中的版本、文件名或校验值。

首次公开发布使用应用标识 `io.github.badspider7.taim`，后续版本应保持不变。当前没有代码签名证书，发布为未签名测试版；如后续配置签名，应同时验证签名身份和升级路径。

## 验证边界

自动化测试覆盖状态转换、重复请求、失败重试、安装前保存失败、开发禁用、日志文本和生产页面。使用真实 electron-updater 对本机 HTTP 测试源执行检查、下载与校验，下载内容为不可执行测试数据，绝不调用真实安装。

本机已用临时 `--config.win.signAndEditExecutable=false` 生成未签名测试包，验证安装包、blockmap、内置 `app-update.yml` 和带版本说明的 `latest.yml` 均生成。标准可执行文件编辑步骤在本机遇到 Windows 符号链接权限限制；临时选项仅用于本地验证，没有写入正式配置。

仍需发布两个不同版本的安装包，手动验证真实签名、GitHub 通道、代理/断网恢复、权限与 NSIS 覆盖安装。自动化测试不能替代这一步。

参考：[electron-builder 自动更新文档](https://www.electron.build/auto-update.html)；实现也核对了项目当前安装的 electron-updater 类型和源码。
