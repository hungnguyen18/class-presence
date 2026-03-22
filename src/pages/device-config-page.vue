<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import AppLayout from '../components/layout/app-layout.vue'
  import { useDevices } from '@/composables/use-devices'
  import { subscribeDevices } from '@/composables/use-realtime'
  import { formatLastSeen } from '@/utils/format'
  import { EDeviceStatus } from '@/types/database'
  import { SNACKBAR_TIMEOUT, DEVICE_ID_DISPLAY_LENGTH } from '@/constants/ui'

  const {
    listDevice,
    isLoading,
    recentlyChangedDeviceId,
    fetchDevices,
    patchDeviceInPlace,
    updateDevice,
    sendCommand,
  } = useDevices()

  const editDialogIsOpen = ref(false)
  const editDeviceCode = ref('')
  const editDescription = ref<string | null>(null)
  const editDeviceId = ref<string | null>(null)
  const editFirmwareVersion = ref('')
  const editRoomName = ref('')
  const editStatus = ref('')
  const editLastSeen = ref('')
  const isSaving = ref(false)

  // Mock config fields (for demo)
  const configScanMode = ref('RFID')
  const configBuzzerEnabled = ref(true)
  const configLedBrightness = ref(80)
  const configAutoLock = ref(true)
  const configHeartbeatInterval = ref(30)
  const configTempThreshold = ref(38)
  const configWifiSsid = ref('ClassRoom-AP')
  const configTimezone = ref('Asia/Ho_Chi_Minh')
  const sendingCommandDeviceId = ref<string | null>(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })
  const searchQuery = ref('')

  // Power Off confirm dialog
  const confirmDialogIsOpen = ref(false)
  const confirmDeviceId = ref<string | null>(null)
  const confirmDeviceCode = ref('')
  const confirmCommand = ref('')
  const confirmInput = ref('')

  const isConfirmInputValid = computed(
    () => confirmInput.value.trim() === confirmDeviceCode.value,
  )

  const statusFilter = ref<string | null>(null)
  const roomFilter = ref<string | null>(null)

  const listRoomOption = computed(() => {
    const rooms = new Set(
      listDevice.value.map((d) => d.room?.name).filter(Boolean) as string[],
    )
    return [
      { title: 'All Rooms', value: null },
      ...[...rooms].sort().map((r) => ({ title: r, value: r })),
    ]
  })

  const filteredDevices = computed(() => {
    let result = listDevice.value

    if (statusFilter.value) {
      result = result.filter((d) => d.status === statusFilter.value)
    }

    if (roomFilter.value) {
      result = result.filter((d) => d.room?.name === roomFilter.value)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(
        (d) =>
          d.deviceCode.toLowerCase().includes(q) ||
          (d.room?.name ?? '').toLowerCase().includes(q) ||
          (d.description ?? '').toLowerCase().includes(q),
      )
    }

    return result
  })

  const onlineCount = computed(
    () => listDevice.value.filter((d) => d.status === EDeviceStatus.ONLINE).length,
  )

  function openEditDialog({ deviceId }: { deviceId: string }) {
    const device = listDevice.value.find((d) => d.id === deviceId)
    if (!device) {
      return
    }
    editDeviceId.value = device.id
    editDeviceCode.value = device.deviceCode
    editDescription.value = device.description
    editFirmwareVersion.value = device.firmwareVersion ?? 'N/A'
    editRoomName.value = device.room?.name ?? 'Unassigned'
    editStatus.value = device.status
    editLastSeen.value = device.lastSeen ?? ''
    editDialogIsOpen.value = true
  }

  function openConfirmDialog({
    deviceId,
    command,
  }: {
    deviceId: string
    command: string
  }) {
    const device = listDevice.value.find((d) => d.id === deviceId)
    if (!device) {
      return
    }
    confirmDeviceId.value = deviceId
    confirmDeviceCode.value = device.deviceCode
    confirmCommand.value = command
    confirmInput.value = ''
    confirmDialogIsOpen.value = true
  }

  function closeEditDialog() {
    editDialogIsOpen.value = false
  }

  async function saveDevice() {
    if (!editDeviceId.value) {
      return
    }

    isSaving.value = true
    const { error } = await updateDevice(editDeviceId.value, {
      description: editDescription.value,
    })
    isSaving.value = false

    if (error) {
      snackbar.value = { show: true, text: 'Failed to update device', color: 'error' }
      return
    }

    snackbar.value = { show: true, text: 'Device updated successfully', color: 'success' }
    editDialogIsOpen.value = false
  }

  function requestCommand({ deviceId, command }: { deviceId: string; command: string }) {
    if (command === 'POWER_OFF') {
      openConfirmDialog({ deviceId, command })
      return
    }
    executeSendCommand({ deviceId, command })
  }

  async function confirmAndSendCommand() {
    if (!confirmDeviceId.value) {
      return
    }
    confirmDialogIsOpen.value = false
    await executeSendCommand({
      deviceId: confirmDeviceId.value,
      command: confirmCommand.value,
    })
  }

  async function executeSendCommand({
    deviceId,
    command,
  }: {
    deviceId: string
    command: string
  }) {
    sendingCommandDeviceId.value = deviceId
    const { error } = await sendCommand(deviceId, command)

    if (error) {
      sendingCommandDeviceId.value = null
      snackbar.value = { show: true, text: `Failed to send ${command}`, color: 'error' }
      return
    }

    snackbar.value = {
      show: true,
      text: `${command} sent. Waiting for device response...`,
      color: 'info',
    }

    // Keep loading until device status changes via realtime (max 15s)
    const timeoutId = setTimeout(() => {
      if (sendingCommandDeviceId.value === deviceId) {
        sendingCommandDeviceId.value = null
        snackbar.value = {
          show: true,
          text: 'Device did not respond in time',
          color: 'warning',
        }
      }
    }, 15000)

    const checkStatus = setInterval(() => {
      const device = listDevice.value.find((d) => d.id === deviceId)
      if (!device) {
        return
      }
      const expectedStatus = command === 'POWER_OFF' ? 'OFFLINE' : 'ONLINE'
      if (device.status === expectedStatus) {
        clearInterval(checkStatus)
        clearTimeout(timeoutId)
        sendingCommandDeviceId.value = null
        snackbar.value = {
          show: true,
          text: `Device is now ${expectedStatus.toLowerCase()}`,
          color: expectedStatus === 'ONLINE' ? 'success' : 'info',
        }
      }
    }, 500)
  }

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    fetchDevices()

    unsubscribe = subscribeDevices((payload) => {
      if (payload.new && typeof payload.new === 'object') {
        patchDeviceInPlace(payload.new)
      }
    }).unsubscribe
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <!-- Header -->
      <v-row class="mb-2" align="center" justify="space-between">
        <v-col cols="12" md="7">
          <h1 class="page-title">Devices</h1>
          <p class="page-subtitle">Manage IoT attendance devices across classrooms.</p>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-md-end">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search devices..."
            density="comfortable"
            hide-details
            clearable
            style="max-width: 300px"
          />
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-row class="mb-4" dense>
        <v-col cols="6" sm="4" md="3">
          <v-select
            v-model="statusFilter"
            :items="[
              { title: 'All Status', value: null },
              { title: 'Online', value: 'ONLINE' },
              { title: 'Offline', value: 'OFFLINE' },
            ]"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-signal"
          />
        </v-col>
        <v-col cols="6" sm="4" md="3">
          <v-select
            v-model="roomFilter"
            :items="listRoomOption"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-door"
          />
        </v-col>
      </v-row>

      <!-- Summary bar -->
      <div class="device-summary mb-6 animate-in animate-delay-1">
        <div class="device-summary__item">
          <span class="device-summary__count">{{ listDevice.length }}</span>
          <span class="device-summary__label">Total</span>
        </div>
        <div class="device-summary__divider" />
        <div class="device-summary__item">
          <span class="device-summary__count device-summary__count--online">{{
            onlineCount
          }}</span>
          <span class="device-summary__label">Online</span>
        </div>
        <div class="device-summary__divider" />
        <div class="device-summary__item">
          <span class="device-summary__count device-summary__count--offline">{{
            listDevice.length - onlineCount
          }}</span>
          <span class="device-summary__label">Offline</span>
        </div>
      </div>

      <!-- Loading -->
      <v-row v-if="isLoading">
        <v-col v-for="n in 3" :key="n" cols="12" sm="6" md="4">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <!-- Device grid -->
      <v-row v-else>
        <v-col
          v-for="(device, index) in filteredDevices"
          :key="device.id"
          cols="12"
          sm="6"
          lg="4"
          class="d-flex"
        >
          <div
            class="device-card animate-in"
            :class="[
              `animate-delay-${Math.min(index + 1, 5)}`,
              {
                'device-card--online': device.status === EDeviceStatus.ONLINE,
                'device-card--offline': device.status !== EDeviceStatus.ONLINE,
                'device-card--changed': recentlyChangedDeviceId === device.id,
              },
            ]"
          >
            <!-- Status bar top -->
            <div
              class="device-card__status-bar"
              :class="
                device.status === EDeviceStatus.ONLINE
                  ? 'device-card__status-bar--online'
                  : 'device-card__status-bar--offline'
              "
            />

            <div class="device-card__body">
              <!-- Header row -->
              <div class="device-card__header">
                <div
                  class="device-card__icon-wrap"
                  :class="
                    device.status === EDeviceStatus.ONLINE
                      ? 'device-card__icon-wrap--online'
                      : ''
                  "
                >
                  <v-icon
                    size="22"
                    :color="
                      device.status === EDeviceStatus.ONLINE ? 'success' : undefined
                    "
                    >mdi-chip</v-icon
                  >
                  <span
                    class="device-card__pulse"
                    :class="{
                      'device-card__pulse--active':
                        device.status === EDeviceStatus.ONLINE,
                    }"
                  />
                </div>
                <div class="device-card__identity">
                  <div class="device-card__code">{{ device.deviceCode }}</div>
                  <div class="device-card__id">
                    {{ device.id.slice(0, DEVICE_ID_DISPLAY_LENGTH) }}
                  </div>
                </div>
                <v-chip
                  :color="device.status === EDeviceStatus.ONLINE ? 'success' : 'error'"
                  variant="tonal"
                  size="small"
                  class="device-card__status-chip"
                  :prepend-icon="
                    device.status === EDeviceStatus.ONLINE
                      ? 'mdi-check-circle'
                      : 'mdi-close-circle'
                  "
                >
                  {{ device.status === EDeviceStatus.ONLINE ? 'Online' : 'Offline' }}
                </v-chip>
              </div>

              <!-- Info grid -->
              <div class="device-card__info">
                <div class="device-card__info-item">
                  <v-icon size="15" class="device-card__info-icon"
                    >mdi-map-marker-outline</v-icon
                  >
                  <div>
                    <div class="device-card__info-label">Room</div>
                    <div class="device-card__info-value">
                      {{ device.room?.name ?? '' }}
                    </div>
                  </div>
                </div>
                <div class="device-card__info-item">
                  <v-icon size="15" class="device-card__info-icon"
                    >mdi-clock-outline</v-icon
                  >
                  <div>
                    <div class="device-card__info-label">Last Seen</div>
                    <div class="device-card__info-value">
                      {{ formatLastSeen(device.lastSeen) }}
                    </div>
                  </div>
                </div>
                <div class="device-card__info-item">
                  <v-icon size="15" class="device-card__info-icon"
                    >mdi-cog-outline</v-icon
                  >
                  <div>
                    <div class="device-card__info-label">Firmware</div>
                    <div class="device-card__info-value">
                      {{ device.firmwareVersion ?? 'N/A' }}
                    </div>
                  </div>
                </div>
                <div class="device-card__info-item">
                  <v-icon size="15" class="device-card__info-icon"
                    >mdi-information-outline</v-icon
                  >
                  <div>
                    <div class="device-card__info-label">Description</div>
                    <div class="device-card__info-value">
                      {{ device.description ?? 'No description' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="device-card__actions">
              <v-btn
                v-if="device.status === EDeviceStatus.ONLINE"
                color="error"
                variant="tonal"
                size="small"
                class="text-none font-weight-medium flex-grow-1"
                prepend-icon="mdi-power"
                :loading="sendingCommandDeviceId === device.id"
                @click="requestCommand({ deviceId: device.id, command: 'POWER_OFF' })"
              >
                Power Off
              </v-btn>
              <v-btn
                v-else
                color="success"
                variant="tonal"
                size="small"
                class="text-none font-weight-medium flex-grow-1"
                prepend-icon="mdi-power"
                :loading="sendingCommandDeviceId === device.id"
                @click="requestCommand({ deviceId: device.id, command: 'POWER_ON' })"
              >
                Power On
              </v-btn>
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                class="text-none font-weight-medium"
                prepend-icon="mdi-pencil-outline"
                :disabled="sendingCommandDeviceId === device.id"
                @click="openEditDialog({ deviceId: device.id })"
              >
                Edit
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Empty state -->
      <div
        v-if="!isLoading && filteredDevices.length === 0 && searchQuery"
        class="text-center py-12"
      >
        <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-magnify-close</v-icon>
        <p class="text-body-1 text-medium-emphasis">
          No devices match "{{ searchQuery }}"
        </p>
      </div>

      <!-- Edit dialog -->
      <v-dialog v-model="editDialogIsOpen" max-width="600" scrollable>
        <v-card>
          <v-card-title class="dialog-title pa-5 pb-3 d-flex align-center ga-3">
            <v-avatar size="36" rounded="lg" color="primary" variant="tonal">
              <v-icon size="18">mdi-chip</v-icon>
            </v-avatar>
            <div>
              <div>Device Settings</div>
              <div class="text-caption text-medium-emphasis font-weight-regular">
                {{ editDeviceCode }}
              </div>
            </div>
            <v-spacer />
            <v-chip
              :color="editStatus === 'ONLINE' ? 'success' : 'error'"
              variant="tonal"
              size="small"
            >
              {{ editStatus === 'ONLINE' ? 'Online' : 'Offline' }}
            </v-chip>
          </v-card-title>
          <v-divider />

          <v-card-text class="pa-5" style="max-height: 520px">
            <!-- Device Info (read-only visual card) -->
            <div class="edit-section-label">Device Info</div>
            <div class="device-info-grid mb-5">
              <div class="device-info-item">
                <v-icon size="16" class="device-info-item__icon">mdi-tag-outline</v-icon>
                <div>
                  <div class="device-info-item__label">Device Code</div>
                  <div class="device-info-item__value">{{ editDeviceCode }}</div>
                </div>
              </div>
              <div class="device-info-item">
                <v-icon size="16" class="device-info-item__icon"
                  >mdi-cellphone-arrow-down</v-icon
                >
                <div>
                  <div class="device-info-item__label">Firmware</div>
                  <div class="device-info-item__value">
                    v{{ editFirmwareVersion }}
                  </div>
                </div>
              </div>
              <div class="device-info-item">
                <v-icon size="16" class="device-info-item__icon"
                  >mdi-map-marker-outline</v-icon
                >
                <div>
                  <div class="device-info-item__label">Room</div>
                  <div class="device-info-item__value">{{ editRoomName }}</div>
                </div>
              </div>
              <div class="device-info-item">
                <v-icon size="16" class="device-info-item__icon">mdi-clock-outline</v-icon>
                <div>
                  <div class="device-info-item__label">Last Seen</div>
                  <div class="device-info-item__value">
                    {{ formatLastSeen(editLastSeen) }}
                  </div>
                </div>
              </div>
            </div>

            <v-divider class="mb-5" />

            <!-- Editable fields -->
            <div class="edit-section-label">General</div>
            <v-textarea
              v-model="editDescription"
              label="Description"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
              hide-details
              class="mb-5"
            />

            <v-divider class="mb-5" />

            <!-- Scan Configuration (mock) -->
            <div class="edit-section-label">Scan Configuration</div>
            <div class="d-flex ga-4 mb-4">
              <v-select
                v-model="configScanMode"
                :items="['RFID', 'Keypad', 'Biometric', 'QR Code']"
                label="Scan Mode"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              />
              <v-text-field
                v-model.number="configHeartbeatInterval"
                label="Heartbeat (sec)"
                type="number"
                variant="outlined"
                density="comfortable"
                hide-details
                style="max-width: 140px"
              />
            </div>

            <v-divider class="mb-5" />

            <!-- Hardware Settings (mock) -->
            <div class="edit-section-label">Hardware</div>
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-body-2 font-weight-medium">Buzzer Sound</div>
                <div class="text-caption text-medium-emphasis">
                  Play sound on check-in events
                </div>
              </div>
              <v-switch
                v-model="configBuzzerEnabled"
                color="primary"
                hide-details
                density="compact"
              />
            </div>
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-body-2 font-weight-medium">Auto-Lock Gate</div>
                <div class="text-caption text-medium-emphasis">
                  Lock barrier after check-in timeout
                </div>
              </div>
              <v-switch
                v-model="configAutoLock"
                color="primary"
                hide-details
                density="compact"
              />
            </div>
            <div class="mb-4">
              <div class="text-body-2 font-weight-medium mb-2">
                LED Brightness: {{ configLedBrightness }}%
              </div>
              <v-slider
                v-model="configLedBrightness"
                :min="10"
                :max="100"
                :step="5"
                color="primary"
                hide-details
                thumb-label
              />
            </div>

            <v-divider class="mb-5" />

            <!-- Environment (mock) -->
            <div class="edit-section-label">Environment</div>
            <div class="d-flex ga-4 mb-4">
              <v-text-field
                v-model.number="configTempThreshold"
                label="Fan Threshold (°C)"
                type="number"
                variant="outlined"
                density="comfortable"
                hide-details
                style="max-width: 160px"
              />
              <v-text-field
                v-model="configWifiSsid"
                label="WiFi SSID"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              />
            </div>
            <v-select
              v-model="configTimezone"
              :items="['Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore', 'UTC']"
              label="Timezone"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-2"
            />
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4 justify-end">
            <v-btn variant="text" class="text-none" @click="closeEditDialog">
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="text-none font-weight-medium"
              :loading="isSaving"
              @click="saveDevice"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Confirm Power Off dialog -->
      <v-dialog v-model="confirmDialogIsOpen" max-width="440">
        <v-card class="confirm-dialog-card">
          <!-- Warning banner -->
          <div class="confirm-warning-banner">
            <v-icon size="20" color="error">mdi-alert-circle</v-icon>
            <span>Destructive Action</span>
          </div>

          <v-card-text class="pa-5 pt-4">
            <div class="d-flex align-center ga-3 mb-4">
              <v-avatar color="error" variant="tonal" size="48">
                <v-icon size="24">mdi-power</v-icon>
              </v-avatar>
              <div>
                <h3 class="confirm-title">Power Off Device</h3>
                <div class="text-caption text-medium-emphasis">
                  {{ confirmDeviceCode }}
                </div>
              </div>
            </div>

            <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
              <div class="text-body-2">
                This will immediately shut down the device. All active check-in
                sessions will be interrupted and the barrier gate will lock.
              </div>
            </v-alert>

            <div class="confirm-impact mb-4">
              <div class="confirm-impact__title">Impact</div>
              <div class="confirm-impact__list">
                <div class="confirm-impact__item">
                  <v-icon size="14" color="error">mdi-close-circle</v-icon>
                  <span>Check-ins will stop immediately</span>
                </div>
                <div class="confirm-impact__item">
                  <v-icon size="14" color="error">mdi-close-circle</v-icon>
                  <span>Barrier gate will lock</span>
                </div>
                <div class="confirm-impact__item">
                  <v-icon size="14" color="error">mdi-close-circle</v-icon>
                  <span>Sensors and display will shut off</span>
                </div>
                <div class="confirm-impact__item">
                  <v-icon size="14" color="warning">mdi-alert</v-icon>
                  <span>Requires manual or remote restart</span>
                </div>
              </div>
            </div>

            <div class="text-body-2 mb-2">
              Type <strong class="confirm-code-highlight">{{ confirmDeviceCode }}</strong> to
              confirm:
            </div>
            <v-text-field
              v-model="confirmInput"
              :placeholder="confirmDeviceCode"
              variant="outlined"
              density="comfortable"
              hide-details
              :color="isConfirmInputValid ? 'error' : undefined"
              class="mb-1"
              autocomplete="off"
            />
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4 justify-end ga-3">
            <v-btn
              variant="text"
              class="text-none font-weight-medium"
              @click="confirmDialogIsOpen = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              class="text-none font-weight-medium"
              prepend-icon="mdi-power"
              :disabled="!isConfirmInputValid"
              @click="confirmAndSendCommand"
            >
              Confirm Power Off
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="SNACKBAR_TIMEOUT"
        location="bottom end"
      >
        {{ snackbar.text }}
      </v-snackbar>
    </v-container>
  </AppLayout>
</template>

<style scoped>
  /* ── Summary bar ── */

  .device-summary {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 14px 24px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: var(--shadow-card);
  }

  .device-summary__item {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .device-summary__count {
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-ink);
  }

  .device-summary__count--online {
    color: var(--color-success);
  }

  .device-summary__count--offline {
    color: var(--color-error);
  }

  .device-summary__label {
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-muted);
  }

  .device-summary__divider {
    width: 1px;
    height: 28px;
    background: var(--color-border);
  }

  /* ── Device card ── */

  .device-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition:
      box-shadow 0.25s ease,
      transform 0.25s ease,
      border-color 0.25s ease;
  }

  .device-card:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
  }

  .device-card--online {
    border-color: rgba(61, 139, 94, 0.2);
  }

  .device-card--offline {
    border-color: var(--color-border);
  }

  /* Status bar (top strip) */

  .device-card__status-bar {
    height: 4px;
    transition: background-color 0.4s ease;
  }

  .device-card__status-bar--online {
    background: linear-gradient(90deg, var(--color-success), #6fcf97);
  }

  .device-card__status-bar--offline {
    background: var(--color-border);
  }

  /* Body */

  .device-card__body {
    padding: 20px 20px 16px;
    flex: 1;
  }

  /* Header */

  .device-card__header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }

  .device-card__icon-wrap {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(44, 62, 80, 0.06);
    flex-shrink: 0;
    transition: background-color 0.3s ease;
  }

  .device-card__icon-wrap--online {
    background: var(--color-success-soft);
  }

  .device-card__pulse {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-ink-muted);
    transition: background-color 0.3s ease;
  }

  .device-card__pulse--active {
    background: var(--color-success);
    box-shadow: 0 0 0 2px var(--color-surface);
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-dot {
    0%,
    100% {
      box-shadow:
        0 0 0 2px var(--color-surface),
        0 0 0 4px transparent;
    }
    50% {
      box-shadow:
        0 0 0 2px var(--color-surface),
        0 0 0 6px rgba(61, 139, 94, 0.25);
    }
  }

  .device-card__identity {
    flex: 1;
    min-width: 0;
  }

  .device-card__code {
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--color-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .device-card__id {
    font-family: var(--font-body);
    font-size: 0.68rem;
    color: var(--color-ink-muted);
    letter-spacing: 0.02em;
    margin-top: 2px;
  }

  .device-card__status-chip {
    flex-shrink: 0;
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  /* Info grid */

  .device-card__info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .device-card__info-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .device-card__info-icon {
    color: var(--color-ink-muted);
    margin-top: 1px;
    flex-shrink: 0;
  }

  .device-card__info-label {
    font-family: var(--font-body);
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-muted);
    margin-bottom: 1px;
  }

  .device-card__info-value {
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-ink);
    line-height: 1.3;
  }

  /* Actions */

  .device-card__actions {
    display: flex;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid var(--color-border);
  }

  /* Changed animation */

  .device-card--changed {
    animation: card-highlight 2s ease-out;
  }

  @keyframes card-highlight {
    0% {
      box-shadow:
        0 0 0 3px var(--color-accent-gold),
        0 4px 20px rgba(212, 168, 83, 0.35);
    }
    100% {
      box-shadow: var(--shadow-card);
    }
  }

  /* ── Dialog ── */

  .dialog-title {
    font-family: var(--font-display) !important;
    font-size: 1.15rem !important;
  }

  .confirm-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
    color: var(--color-ink);
  }

  /* ── Responsive ── */

  @media (max-width: 600px) {
    .device-summary {
      gap: 16px;
      padding: 12px 16px;
    }

    .device-summary__count {
      font-size: 1.2rem;
    }

    .device-card__info {
      grid-template-columns: 1fr;
    }

    .device-card__body {
      padding: 16px;
    }

    .device-card__actions {
      padding: 10px 16px 14px;
    }
  }

  /* ── Edit Dialog ── */

  .edit-section-label {
    font-family: var(--font-body);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-muted);
    margin-bottom: 12px;
  }

  /* ── Confirm Dialog ── */

  .confirm-warning-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    background: rgba(192, 84, 79, 0.08);
    border-bottom: 2px solid rgba(192, 84, 79, 0.25);
    font-family: var(--font-body);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-error);
  }

  .confirm-impact {
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: linear-gradient(135deg, rgba(44, 62, 80, 0.02), rgba(44, 62, 80, 0.04));
  }

  .confirm-impact__title {
    font-family: var(--font-body);
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-muted);
    margin-bottom: 8px;
  }

  .confirm-impact__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .confirm-impact__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
    font-size: 0.8rem;
    color: var(--color-ink);
  }

  .confirm-code-highlight {
    font-family: monospace;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(192, 84, 79, 0.1);
    color: var(--color-error);
    font-size: 0.85rem;
  }

  .device-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .device-info-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: linear-gradient(135deg, rgba(44, 62, 80, 0.02), rgba(44, 62, 80, 0.04));
  }

  .device-info-item__icon {
    color: var(--color-ink-muted);
    flex-shrink: 0;
  }

  .device-info-item__label {
    font-family: var(--font-body);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-ink-muted);
    margin-bottom: 1px;
  }

  .device-info-item__value {
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.3;
  }
</style>
