import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'overview',
    component: () => import('@/pages/overview/index.vue'),
  },
  {
    path: '/statistics',
    name: 'statics',
    component: () => import('@/pages/statistic/index.vue'),
  },
  {
    path: '/setting',
    name: 'setting',
    component: () => import('@/pages/setting/index.vue'),
  },
  {
    path: '/detail',
    name: 'detail',
    component: () => import('@/pages/detail/index.vue'),
  },
  {
    path: '/category',
    name: 'category',
    component: () => import('@/pages/category/index.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
