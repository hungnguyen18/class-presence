import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { isAttendanceStatus, EAttendanceStatus } from '@/types/attendance'
import { LIST_DAY_SHORT, DAY_COUNT } from '@/constants/schedule'

export interface IDashboardStats {
  totalClass: number
  totalStudent: number
  totalDevice: number
  todaySessionCount: number
}

export interface IWeeklyTrendDay {
  label: string
  onTime: number
  late: number
  absent: number
}

export interface IClassBreakdown {
  label: string
  onTime: number
  late: number
  absent: number
}

const stats = ref<IDashboardStats>({
  totalClass: 0,
  totalStudent: 0,
  totalDevice: 0,
  todaySessionCount: 0,
})

const weeklyTrend = ref<IWeeklyTrendDay[]>([])
const classBreakdown = ref<IClassBreakdown[]>([])
const overallBreakdown = ref({ onTime: 0, late: 0, absent: 0 })
const isLoading = ref(false)

async function fetchDashboardStats(filterClassId?: string | null) {
  isLoading.value = true

  try {
    let attendanceQuery = supabase
      .from('cp_attendance_logs')
      .select('status, class_id, checkin_time')

    if (filterClassId) {
      attendanceQuery = attendanceQuery.eq('class_id', filterClassId)
    }

    const [classResult, studentResult, deviceResult, attendanceResult, classesResult] =
      await Promise.all([
        supabase.from('cp_classes').select('id', { count: 'exact', head: true }),
        supabase.from('cp_students').select('id', { count: 'exact', head: true }),
        supabase.from('cp_devices').select('id', { count: 'exact', head: true }),
        attendanceQuery,
        supabase.from('cp_classes').select('id, class_code, subject_name'),
      ])

    stats.value = {
      totalClass: classResult.count ?? 0,
      totalStudent: studentResult.count ?? 0,
      totalDevice: deviceResult.count ?? 0,
      todaySessionCount: 0,
    }

    const listLog = attendanceResult.data ?? []

    // Overall breakdown
    let onTime = 0
    let late = 0
    let absent = 0
    for (let i = 0; i < listLog.length; i += 1) {
      const log = listLog[i]!
      if (log.status === EAttendanceStatus.ON_TIME) {
        onTime += 1
      } else if (log.status === EAttendanceStatus.LATE) {
        late += 1
      } else if (log.status === EAttendanceStatus.ABSENT) {
        absent += 1
      }
    }
    overallBreakdown.value = { onTime, late, absent }

    // Weekly trend — group by day of week from checkin_time
    const dayMap: Record<number, { onTime: number; late: number; absent: number }> = {}
    for (let d = 0; d < DAY_COUNT; d += 1) {
      dayMap[d] = { onTime: 0, late: 0, absent: 0 }
    }

    for (let i = 0; i < listLog.length; i += 1) {
      const log = listLog[i]!
      if (!log.checkin_time) {
        continue
      }
      const date = new Date(log.checkin_time)
      const jsDay = date.getDay()
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1
      if (dayIndex >= DAY_COUNT) {
        continue
      }
      const bucket = dayMap[dayIndex]!
      if (!isAttendanceStatus(log.status)) {
        continue
      }
      if (log.status === EAttendanceStatus.ON_TIME) {
        bucket.onTime += 1
      } else if (log.status === EAttendanceStatus.LATE) {
        bucket.late += 1
      } else {
        bucket.absent += 1
      }
    }

    weeklyTrend.value = [...LIST_DAY_SHORT].map((label, i) => ({
      label,
      ...dayMap[i]!,
    }))

    // Per-class breakdown
    const listClassData = classesResult.data ?? []
    const classMap: Record<
      string,
      { label: string; onTime: number; late: number; absent: number }
    > = {}
    for (let i = 0; i < listClassData.length; i += 1) {
      const c = listClassData[i]!
      classMap[c.id] = {
        label: `${c.subject_name} — ${c.class_code}`,
        onTime: 0,
        late: 0,
        absent: 0,
      }
    }

    for (let i = 0; i < listLog.length; i += 1) {
      const log = listLog[i]!
      const bucket = classMap[log.class_id]
      if (!bucket) {
        continue
      }
      if (!isAttendanceStatus(log.status)) {
        continue
      }
      if (log.status === EAttendanceStatus.ON_TIME) {
        bucket.onTime += 1
      } else if (log.status === EAttendanceStatus.LATE) {
        bucket.late += 1
      } else {
        bucket.absent += 1
      }
    }

    classBreakdown.value = Object.values(classMap)
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err)
  } finally {
    isLoading.value = false
  }
}

export function useDashboardStats() {
  return {
    stats,
    weeklyTrend,
    classBreakdown,
    overallBreakdown,
    isLoading,
    fetchDashboardStats,
  }
}
