import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DashboardPage from '../pages/dashboard-page.vue'
import ClassListPage from '../pages/class-list-page.vue'
import ClassDashboardPage from '../pages/class-dashboard-page.vue'
import DeviceConfigPage from '../pages/device-config-page.vue'

const listRoute: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
  },
  {
    path: '/classes',
    name: 'classList',
    component: ClassListPage,
  },
  {
    path: '/classes/:classId',
    name: 'classDashboard',
    component: ClassDashboardPage,
  },
  {
    path: '/devices',
    name: 'deviceConfig',
    component: DeviceConfigPage,
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: listRoute,
})

