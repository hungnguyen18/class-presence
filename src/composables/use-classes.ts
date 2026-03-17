import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { transformWithRelation } from '@/utils/transform'
import type { IClassWithRoom } from '@/types/database'

const listClass = ref<IClassWithRoom[]>([])
const isLoading = ref(false)

async function fetchClasses() {
  isLoading.value = true
  const { data, error } = await supabase
    .from('cp_classes')
    .select('*, cp_rooms(*)')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch classes:', error.message)
    isLoading.value = false
    return
  }

  listClass.value = (data ?? []).map((row) =>
    transformWithRelation<IClassWithRoom>(row, 'cp_rooms', 'room'),
  )
  isLoading.value = false
}

export function useClasses() {
  return { listClass, isLoading, fetchClasses }
}
