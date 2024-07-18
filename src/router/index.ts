import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'overview',
    component: () => import('@/pages/Overview.vue'),
  },
  {
    path: '/statistics',
    name: 'statics',
    component: () => import('@/pages/Statistics.vue'),
  },
  {
    path: '/setting',
    name: 'setting',
    component: () => import('@/pages/Setting.vue'),
  },
  {
    path: '/detail',
    name: 'detail',
    component: () => import('@/pages/Detail.vue'),
  },
  {
    path: '/category',
    name: 'category',
    component: () => import('@/pages/Category.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
