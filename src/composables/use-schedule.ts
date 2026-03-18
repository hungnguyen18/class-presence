import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { transformWithRelation } from '@/utils/transform'
import { getClassTheme } from '@/constants/class'
import { DAY_COUNT } from '@/constants/schedule'
import type { IClassWithRoom } from '@/types/database'

export interface IScheduleSession {
  id: string
  className: string
  classCode: string
  room: string
  startTime: string
  endTime: string
  day: number
  icon: string
  color: string
  studentCount: number
}

const listSession = ref<IScheduleSession[]>([])
const isLoading = ref(false)

async function fetchSchedule() {
  isLoading.value = true

  const { data, error } = await supabase
    .from('cp_classes')
    .select('*, cp_rooms(*)')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Failed to fetch schedule:', error.message)
    isLoading.value = false
    return
  }

  // Count students per class
  const { data: studentCounts } = await supabase.from('cp_students').select('class_id')

  const countMap: Record<string, number> = {}
  for (let i = 0; i < (studentCounts ?? []).length; i += 1) {
    const row = studentCounts![i]!
    countMap[row.class_id] = (countMap[row.class_id] ?? 0) + 1
  }

  const listClassWithRoom = (data ?? []).map((row) =>
    transformWithRelation<IClassWithRoom>(row, 'cp_rooms', 'room'),
  )

  // Transform classes to schedule sessions
  // start_time/end_time format: "HH:MM" or include day info
  // For now, we derive day from the class data or distribute across the week
  const sessions: IScheduleSession[] = []
  for (let i = 0; i < listClassWithRoom.length; i += 1) {
    const cls = listClassWithRoom[i]!
    const theme = getClassTheme(cls.subjectName)
    const studentCount = countMap[cls.id] ?? 0

    // Parse start_time/end_time — they may be "HH:MM:SS" or "HH:MM"
    const startTime = cls.startTime.slice(0, 5)
    const endTime = cls.endTime.slice(0, 5)

    // Distribute classes across week days (simple round-robin for demo)
    // Each class gets 2 sessions per week
    const dayAssignment = [((i * 2) % DAY_COUNT) + 1, ((i * 2 + 2) % DAY_COUNT) + 1]
    for (let d = 0; d < dayAssignment.length; d += 1) {
      sessions.push({
        id: `${cls.id}-${d}`,
        className: cls.subjectName,
        classCode: cls.classCode,
        room: cls.room.name,
        startTime,
        endTime,
        day: dayAssignment[d]!,
        icon: theme.icon,
        color: theme.color,
        studentCount,
      })
    }
  }

  listSession.value = sessions
  isLoading.value = false
}

export function useSchedule() {
  return { listSession, isLoading, fetchSchedule }
}
