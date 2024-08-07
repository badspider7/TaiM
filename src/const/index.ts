// 需要在设置中更改并且持久化的变量

export interface sidebarItem {
  title: string
  name: string
  icon: string
  path: string
}

export const DEFAULT_DISPLAY_SIDEBAR: sidebarItem[] = [
  {
    title: '概览',
    name: 'overview',
    icon: 'home',
    path: '/',
  },
  {
    title: '统计',
    name: 'statics',
    icon: 'statics',
    path: '/statistics',
  },
  {
    title: '详细',
    name: 'detail',
    icon: 'detail',
    path: '/detail',
  },
  {
    title: '分类',
    name: 'category',
    icon: 'category',
    path: '/category',
  },
]

export const ACTIVE_TAB_TYPE = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
}
