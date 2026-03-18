import type { IStudentAttendance, TAttendanceStatus } from '../types/attendance'
import { EAttendanceStatus } from '@/types/attendance'
import { LATE_WEIGHT, ATTENDANCE_STATUS_COLOR_MAP } from '@/constants/attendance'

export interface IAttendanceStats {
  totalStudent: number
  totalOnTime: number
  totalLate: number
  totalAbsent: number
}

export function calculateAttendanceStats({
  listStudentAttendance,
}: {
  listStudentAttendance: IStudentAttendance[]
}): IAttendanceStats {
  let totalOnTime = 0
  let totalLate = 0
  let totalAbsent = 0

  for (let index = 0; index < listStudentAttendance.length; index += 1) {
    const attendanceItem = listStudentAttendance[index]

    if (!attendanceItem) {
      continue
    }

    if (attendanceItem.status === EAttendanceStatus.ON_TIME) {
      totalOnTime += 1
    } else if (attendanceItem.status === EAttendanceStatus.LATE) {
      totalLate += 1
    } else if (attendanceItem.status === EAttendanceStatus.ABSENT) {
      totalAbsent += 1
    }
  }

  return {
    totalStudent: listStudentAttendance.length,
    totalOnTime,
    totalLate,
    totalAbsent,
  }
}

export function calculateAttendanceRate({ stats }: { stats: IAttendanceStats }): number {
  if (stats.totalStudent === 0) {
    return 0
  }

  const totalPresentLike = stats.totalOnTime + stats.totalLate * LATE_WEIGHT

  return Math.round((totalPresentLike / stats.totalStudent) * 100)
}

export function getAttendanceStatusColor({
  status,
}: {
  status: TAttendanceStatus
}): string {
  return ATTENDANCE_STATUS_COLOR_MAP[status] ?? 'error'
}
