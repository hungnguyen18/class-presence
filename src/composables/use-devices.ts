import { ref } from 'vue'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { transformWithRelation } from '@/utils/transform'
import { snakeToCamel } from '@/utils/transform'
import type { IDeviceWithRoom, IDevice } from '@/types/database'

const listDevice = ref<IDeviceWithRoom[]>([])
const isLoading = ref(false)
const recentlyChangedDeviceId = ref<string | null>(null)

async function fetchDevices() {
  isLoading.value = true
  const { data, error } = await supabase
    .from('cp_devices')
    .select('*, cp_rooms(*)')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch devices:', error.message)
    isLoading.value = false
    return
  }

  listDevice.value = (data ?? []).map((row) =>
    transformWithRelation<IDeviceWithRoom>(row, 'cp_rooms', 'room'),
  )
  isLoading.value = false
}

/**
 * Update a single device in-place without refetching the entire list.
 * Used by realtime subscription to avoid full re-render.
 * Only triggers Vue reactivity + highlight if status actually changed.
 * Heartbeat-only updates (last_seen) are silently absorbed.
 */
function patchDeviceInPlace(updatedFields: Record<string, unknown>) {
  const camelFields = snakeToCamel<Partial<IDevice>>(updatedFields)
  const deviceId = (updatedFields.id as string) ?? camelFields.id
  if (!deviceId) {
    return
  }

  const index = listDevice.value.findIndex((d) => d.id === deviceId)
  if (index === -1) {
    return
  }

  const existing = listDevice.value[index]!
  const statusChanged = camelFields.status !== undefined && camelFields.status !== existing.status

  if (!statusChanged) {
    // Silently update lastSeen without replacing the object ref
    // This avoids triggering Vue re-render for heartbeat-only changes
    existing.lastSeen = camelFields.lastSeen ?? existing.lastSeen
    return
  }

  // Status changed — replace object to trigger reactivity + highlight
  listDevice.value[index] = { ...existing, ...camelFields, room: existing.room }

  recentlyChangedDeviceId.value = deviceId
  setTimeout(() => {
    if (recentlyChangedDeviceId.value === deviceId) {
      recentlyChangedDeviceId.value = null
    }
  }, 2000)
}

async function updateDevice(
  deviceId: string,
  data: { device_code?: string; description?: string | null },
) {
  const { error } = await invokeEdgeFunction('update-device', {
    device_id: deviceId,
    ...data,
  })

  if (error) {
    console.error('Failed to update device:', error)
    return { error }
  }

  await fetchDevices()
  return { error: null }
}

async function sendCommand(
  deviceId: string,
  command: string,
  payload: Record<string, unknown> | null = null,
) {
  const { error } = await invokeEdgeFunction('send-command', {
    device_id: deviceId,
    command,
    payload,
  })

  if (error) {
    console.error('Failed to send command:', error)
    return { error }
  }

  return { error: null }
}

export function useDevices() {
  return {
    listDevice,
    isLoading,
    recentlyChangedDeviceId,
    fetchDevices,
    patchDeviceInPlace,
    updateDevice,
    sendCommand,
  }
}
