import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { snakeToCamel } from '@/utils/transform'
import type { IStudent } from '@/types/database'

const listStudent = ref<IStudent[]>([])
const isLoading = ref(false)

async function fetchStudents(classId: string) {
  isLoading.value = true
  const { data, error } = await supabase
    .from('cp_students')
    .select('*')
    .eq('class_id', classId)
    .order('mssv', { ascending: true })

  if (error) {
    console.error('Failed to fetch students:', error.message)
    isLoading.value = false
    return
  }

  listStudent.value = snakeToCamel<IStudent[]>(data ?? [])
  isLoading.value = false
}

export function useStudents() {
  return { listStudent, isLoading, fetchStudents }
}
