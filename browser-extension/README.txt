TaiM 网站计时扩展（Chrome / Edge 120+）

下载与完整说明：https://github.com/badspider7/TaiM/blob/main/docs/browser-extension.md
公开下载：https://github.com/badspider7/TaiM/releases → TaiM-Browser-Extension.zip

1. 在 TaiM → 网站开启计时，点击右上角“使用说明 / 扩展下载”。
2. 下载通用 ZIP 并解压，或从 TaiM 准备内置扩展目录。
3. 打开 chrome://extensions 或 edge://extensions，开启“开发者模式”。
4. 点击“加载已解压的扩展”，选择包含 manifest.json 的目录。
5. 内置扩展自动配对；通用 ZIP 请在 TaiM 使用说明页复制配对码，点击浏览器工具栏的 TaiM 扩展图标，粘贴后保存。
6. 回到 TaiM → 网站，确认“扩展已连接”，浏览普通网页后查询 / 刷新。

仅统计系统前台浏览器的当前标签页；后台、空闲、锁屏、休眠、无痕及浏览器内部页面不计时。
按约 1 秒采样，不是浏览历史回填。断开连接后不会补计未观测时间。
网址包含路径和查询参数，不保留账号密码及 # 片段。所有记录只保存在本机。
标题和网址可能包含个人信息，JSON / CSV 备份应妥善保管。
通用 ZIP 不含个人配对码。手动配对码仅存本机扩展存储，不通过浏览器同步。
内置扩展的 connection.js 含本机配对密钥，请勿分享配对后的目录。换电脑需重新配对。
更新 TaiM 后如扩展发生变化，重新准备目录，并在扩展管理页点击“重新加载”。
