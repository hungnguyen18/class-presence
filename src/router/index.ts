import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/composables/use-auth'
import DashboardPage from '../pages/dashboard-page.vue'
import ClassListPage from '../pages/class-list-page.vue'
import ClassDashboardPage from '../pages/class-dashboard-page.vue'
import DeviceConfigPage from '../pages/device-config-page.vue'
import SchedulePage from '../pages/schedule-page.vue'
import LoginPage from '../pages/login-page.vue'

const listRoute: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { isPublic: true },
  },
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
    path: '/schedule',
    name: 'schedule',
    component: SchedulePage,
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

router.beforeEach(async (to) => {
  const { isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading.value) {
    await new Promise<void>((resolve) => {
      let stop: (() => void) | undefined
      stop = watch(isAuthLoading, (loading) => {
        if (!loading) {
          stop?.()
          resolve()
        }
      })
    })
  }

  if (!to.meta.isPublic && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.meta.isPublic && isAuthenticated.value) {
    return { name: 'dashboard' }
  }
})
