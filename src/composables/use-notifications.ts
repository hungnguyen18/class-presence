import { ref, computed } from 'vue'

export type TNotificationType = 'checkin' | 'device'

export type TNotification = {
  id: string
  type: TNotificationType
  title: string
  message: string
  color: string
  icon: string
  timestamp: Date
  isRead: boolean
}

const MAX_NOTIFICATIONS = 50

// Singleton state
const listNotification = ref<TNotification[]>([])

const unreadCount = computed(
  () => listNotification.value.filter((n) => !n.isRead).length,
)

function addNotification(notification: Omit<TNotification, 'id' | 'timestamp' | 'isRead'>) {
  const item: TNotification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    isRead: false,
  }

  listNotification.value.unshift(item)

  if (listNotification.value.length > MAX_NOTIFICATIONS) {
    listNotification.value = listNotification.value.slice(0, MAX_NOTIFICATIONS)
  }
}

function markAllRead() {
  for (let i = 0; i < listNotification.value.length; i += 1) {
    listNotification.value[i]!.isRead = true
  }
}

function clearAll() {
  listNotification.value = []
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) {
    return 'just now'
  }
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    return `${m}m ago`
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    return `${h}h ago`
  }
  const d = Math.floor(seconds / 86400)
  return `${d}d ago`
}

/**
 * Called from existing realtime subscriptions — no duplicate channels.
 */
function notifyCheckin(payload: Record<string, unknown>) {
  const status = payload.status as string ?? ''
  const mssv = payload.mssv as string ?? '?'
  const name = payload.full_name as string ?? ''

  const isLate = status === 'LATE'
  addNotification({
    type: 'checkin',
    title: isLate ? 'Late Check-in' : 'New Check-in',
    message: name ? `${name} (${mssv})` : `Student ${mssv}`,
    color: isLate ? 'warning' : 'success',
    icon: isLate ? 'mdi-account-clock' : 'mdi-account-check',
  })
}

function notifyDeviceChange(payload: {
  deviceCode: string
  newStatus: string
  oldStatus?: string
}) {
  // Only notify on actual status change
  if (payload.newStatus === payload.oldStatus) {
    return
  }

  const isOnline = payload.newStatus === 'ONLINE'
  addNotification({
    type: 'device',
    title: `Device ${payload.deviceCode}`,
    message: isOnline ? 'is now Online' : 'went Offline',
    color: isOnline ? 'success' : 'error',
    icon: isOnline ? 'mdi-access-point' : 'mdi-access-point-off',
  })
}

export function useNotifications() {
  return {
    listNotification,
    unreadCount,
    markAllRead,
    clearAll,
    formatTimeAgo,
    notifyCheckin,
    notifyDeviceChange,
  }
}
