import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function subscribeAttendance(
  callback: (payload: { new: Record<string, unknown> }) => void,
  classId?: string,
): { unsubscribe: () => void } {
  let channel: RealtimeChannel

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
        (payload) => callback(payload as { new: Record<string, unknown> }),
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
        (payload) => callback(payload as { new: Record<string, unknown> }),
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
