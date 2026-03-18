import { ref } from 'vue'
import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import { transformWithRelation } from '@/utils/transform'
import { getClassTheme } from '@/constants/class'
import type { IClassWithRoom } from '@/types/database'

export interface ITodaySession {
  id: string
  className: string
  classCode: string
  room: string
  startTime: string
  endTime: string
  icon: string
  color: string
  studentCount: number
  checkedInCount: number
  isLive: boolean
  isPast: boolean
}

const currentClass = ref<ITodaySession | null>(null)
const nextClass = ref<ITodaySession | null>(null)
const listTodaySession = ref<ITodaySession[]>([])
const todayCheckedInTotal = ref(0)
const todayStudentTotal = ref(0)
const isLoading = ref(false)

async function fetchTodaySchedule() {
  isLoading.value = true

  const now = dayjs()

  const [classResult, studentResult, attendanceResult] = await Promise.all([
    supabase
      .from('cp_classes')
      .select('*, cp_rooms(*)')
      .order('start_time', { ascending: true }),
    supabase.from('cp_students').select('class_id'),
    supabase
      .from('cp_attendance_logs')
      .select('class_id, student_id')
      .gte('checkin_time', now.startOf('day').toISOString())
      .lte('checkin_time', now.endOf('day').toISOString()),
  ])

  if (classResult.error) {
    isLoading.value = false
    return
  }

  // Build student count map
  const studentCountMap: Record<string, number> = {}
  for (let i = 0; i < (studentResult.data ?? []).length; i += 1) {
    const row = studentResult.data![i]!
    studentCountMap[row.class_id] = (studentCountMap[row.class_id] ?? 0) + 1
  }

  // Build today's checked-in count per class (unique students)
  const checkedInMap: Record<string, Set<string>> = {}
  for (let i = 0; i < (attendanceResult.data ?? []).length; i += 1) {
    const row = attendanceResult.data![i]!
    if (!checkedInMap[row.class_id]) {
      checkedInMap[row.class_id] = new Set()
    }
    checkedInMap[row.class_id]!.add(row.student_id)
  }

  const listClassWithRoom = (classResult.data ?? []).map((row) =>
    transformWithRelation<IClassWithRoom>(row, 'cp_rooms', 'room'),
  )

  const sessions: ITodaySession[] = []
  for (let i = 0; i < listClassWithRoom.length; i += 1) {
    const cls = listClassWithRoom[i]!
    const theme = getClassTheme(cls.subjectName)
    const startTime = cls.startTime.slice(0, 5)
    const endTime = cls.endTime.slice(0, 5)

    const startDateTime = dayjs(`${now.format('YYYY-MM-DD')} ${startTime}`)
    const endDateTime = dayjs(`${now.format('YYYY-MM-DD')} ${endTime}`)

    const isLive = now.isAfter(startDateTime) && now.isBefore(endDateTime)
    const isPast = now.isAfter(endDateTime)

    const checkedInSet = checkedInMap[cls.id]
    const checkedInCount = checkedInSet ? checkedInSet.size : 0
    const studentCount = studentCountMap[cls.id] ?? 0

    sessions.push({
      id: cls.id,
      className: cls.subjectName,
      classCode: cls.classCode,
      room: cls.room.name,
      startTime,
      endTime,
      icon: theme.icon,
      color: theme.color,
      studentCount,
      checkedInCount,
      isLive,
      isPast,
    })
  }

  // Sort by start time
  sessions.sort((a, b) => a.startTime.localeCompare(b.startTime))

  listTodaySession.value = sessions

  // Determine currentClass and nextClass
  const liveSession = sessions.find((s) => s.isLive) ?? null
  const upcomingSession = sessions.find((s) => !s.isLive && !s.isPast) ?? null

  currentClass.value = liveSession
  nextClass.value = liveSession ? null : upcomingSession

  // Totals for "all done" state
  todayCheckedInTotal.value = sessions.reduce((sum, s) => sum + s.checkedInCount, 0)
  todayStudentTotal.value = sessions.reduce((sum, s) => sum + s.studentCount, 0)

  isLoading.value = false
}

export function useTodaySchedule() {
  return {
    currentClass,
    nextClass,
    listTodaySession,
    todayCheckedInTotal,
    todayStudentTotal,
    isLoading,
    fetchTodaySchedule,
  }
}
