import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/composables/use-notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function subscribeAttendance(
  callback: (payload: { new: Record<string, unknown> }) => void,
  classId?: string,
): { unsubscribe: () => void } {
  let channel: RealtimeChannel

  const handlePayload = async (payload: { new: Record<string, unknown> }) => {
    callback(payload)

    // Push notification
    const raw = payload.new
    if (raw) {
      const { notifyCheckin } = useNotifications()
      // Fetch student info for notification
      const studentId = raw.student_id as string
      let mssv = ''
      let fullName = ''
      if (studentId) {
        const { data } = await supabase
          .from('cp_students')
          .select('mssv, full_name')
          .eq('id', studentId)
          .single()
        if (data) {
          mssv = data.mssv
          fullName = data.full_name
        }
      }
      notifyCheckin({
        status: raw.status as string,
        mssv,
        full_name: fullName,
      })
    }
  }

  if (classId) {
    channel = supabase
      .channel(`attendance-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cp_attendance_logs',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => handlePayload(payload as { new: Record<string, unknown> }),
      )
      .subscribe()
  } else {
    channel = supabase
      .channel('attendance-all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cp_attendance_logs',
        },
        (payload) => handlePayload(payload as { new: Record<string, unknown> }),
      )
      .subscribe()
  }

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

export function subscribeDevices(
  callback: (payload: { new: Record<string, unknown> }) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel('devices')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cp_devices',
      },
      (payload) => callback(payload as { new: Record<string, unknown> }),
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}
