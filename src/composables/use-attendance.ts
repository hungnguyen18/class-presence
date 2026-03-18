import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { transformWithRelation } from '@/utils/transform'
import type { IAttendanceLogWithStudent } from '@/types/database'
import type { IStudentAttendance } from '@/types/attendance'
import { EAttendanceStatus } from '@/types/attendance'
import { calculateAttendanceStats, calculateAttendanceRate } from '@/utils/attendance'

const listAttendanceLog = ref<IAttendanceLogWithStudent[]>([])
const isLoading = ref(false)

async function fetchAttendance(classId: string) {
  isLoading.value = true
  const { data, error } = await supabase
    .from('cp_attendance_logs')
    .select('*, cp_students(mssv, full_name)')
    .eq('class_id', classId)
    .order('checkin_time', { ascending: false })

  if (error) {
    console.error('Failed to fetch attendance:', error.message)
    isLoading.value = false
    return
  }

  listAttendanceLog.value = (data ?? []).map((row) =>
    transformWithRelation<IAttendanceLogWithStudent>(row, 'cp_students', 'student'),
  )
  isLoading.value = false
}

const listStudentAttendance = computed<IStudentAttendance[]>(() =>
  listAttendanceLog.value.map((log) => ({
    id: log.id,
    studentCode: log.student.mssv,
    fullName: log.student.fullName,
    status: log.status,
    checkInTime:
      log.status === EAttendanceStatus.ABSENT
        ? null
        : (log.checkinTime?.slice(11, 16) ?? null),
    seatCode: log.seatNumber,
  })),
)

const attendanceStats = computed(() =>
  calculateAttendanceStats({ listStudentAttendance: listStudentAttendance.value }),
)

const attendanceRate = computed(() =>
  calculateAttendanceRate({ stats: attendanceStats.value }),
)

export function useAttendance() {
  return {
    listAttendanceLog,
    listStudentAttendance,
    attendanceStats,
    attendanceRate,
    isLoading,
    fetchAttendance,
  }
}
