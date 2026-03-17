export { EAttendanceStatus } from '@/types/attendance'
export { EDeviceStatus, EDeviceCommand, ECommandStatus } from '@/types/database'

export const ATTENDANCE_RATE_GOOD = 80
export const ATTENDANCE_RATE_WARNING = 60
export const LATE_WEIGHT = 0.5

export const ATTENDANCE_STATUS_COLOR_MAP: Record<string, string> = {
  ON_TIME: 'success',
  LATE: 'warning',
  ABSENT: 'error',
}

export const ATTENDANCE_STATUS_LABEL_MAP: Record<string, string> = {
  ON_TIME: 'On Time',
  LATE: 'Late',
  ABSENT: 'Absent',
}
