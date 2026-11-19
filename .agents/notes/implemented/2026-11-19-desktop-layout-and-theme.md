# 桌面框架、主题和共享应用行

Status: implemented

## 问题

各页分别控制边框和滚动，并重复实现应用列表。深色主题下，浅色悬停背景使侧栏文本和图标难以辨认，应用图标底板、排行条和滚动条也保留了固定浅色。

## 决定

窗口使用固定标题栏与侧栏，主内容区统一滚动。宽窗口横排图标与导航名称，窄窗口压缩侧栏。页面标题、表面、空状态和交互颜色通过共享组件与主题变量统一。原色应用图标放到可随主题变化的底板上，图标加载失败时显示名称首字。概览和统计时段明细共用应用行。

分类页分开呈现分类管理与应用归类，重命名时聚焦输入框。设置按用途分组，用有可访问名称的开关表示布尔偏好，并在路由查询中保留当前设置页签。网站帮助按步骤分组，执行结果紧邻触发按钮。

## 考虑过的替代方案

- 单独给深色主题增加覆盖。初期已有针对图标路径的覆盖，固定悬停色以及重复行样式仍容易漏改。共享主题变量可让浅色和深色使用同一组件。
- 在应用列表的两个入口分别维护行样式。原有实现重复了色值、排序条展示和详情跳转，继续分开会增加修复和验证成本。

## 影响与代价

主内容统一滚动后，切换页面、设置页签或选中的应用会返回内容顶部。浏览历史中的滚动位置目前没有恢复。依照宽度切换布局的页面须在常规窗口和窄窗口下分别检查。

## 涉及文件

- [App.vue](../../../src/App.vue)、[Header.vue](../../../src/components/layout/Header.vue)、[SideBar.vue](../../../src/components/layout/SideBar.vue)、[PageHeading.vue](../../../src/components/layout/PageHeading.vue)、[主样式](../../../src/style/index.scss) 和 [Tailwind 配置](../../../tailwind.config.js) 定义窗口、导航、滚动和共享样式。
- [NoData.vue](../../../src/components/NoData.vue)、[AppUsageRow.vue](../../../src/components/AppUsageRow.vue)、[AppDetail.vue](../../../src/components/AppDetail.vue)、[FrequentApp.vue](../../../src/pages/overview/FrequentApp.vue) 和 [Progress.vue](../../../src/components/ui/progress/Progress.vue) 共用空状态、图标底板、时长条及可聚焦的应用链接。
- [SelectTrigger.vue](../../../src/components/ui/select/SelectTrigger.vue)、[Switch.vue](../../../src/components/ui/switch/Switch.vue) 与 [TabsTrigger.vue](../../../src/components/ui/tabs/TabsTrigger.vue) 的颜色随主题立即切换，开关保留滑块动画。
- [分类页](../../../src/pages/category/index.vue)、[设置页](../../../src/pages/setting/index.vue)、[设置页签](../../../src/pages/setting/TabBar.vue)、[通用](../../../src/pages/setting/components/Common.vue)、[行为](../../../src/pages/setting/components/Behavior.vue)、[数据](../../../src/pages/setting/components/Data.vue)、[关于](../../../src/pages/setting/components/About.vue) 与 [网站帮助](../../../src/pages/websites/help.vue) 使用共享框架与操作反馈。

## 验证与限制

`pnpm lint`、`pnpm build` 和 `pnpm test` 已通过。 [ui-select.mjs](../../../tests/ui-select.mjs) 检查主题切换、悬停对比、焦点样式与窗口大小偏好保存。 [integration.mjs](../../../tests/integration.mjs) 验证主页面在 690 像素宽的测试窗口中适配，并输出截图供人工核对。此轮未发布安装包。

## 提交追踪

- 实现提交：`98c1037815f94f56d06dd40091336b67b081037a`。
- 基准 `HEAD`：`694579b192ecbe1e90f2f31455e0c8c77258ab2f`。
