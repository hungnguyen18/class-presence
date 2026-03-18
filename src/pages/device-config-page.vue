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
  const isSaving = ref(false)
  const sendingCommandDeviceId = ref<string | null>(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })
  const searchQuery = ref('')

  // Power Off confirm dialog
  const confirmDialogIsOpen = ref(false)
  const confirmDeviceId = ref<string | null>(null)
  const confirmDeviceCode = ref('')
  const confirmCommand = ref('')

  const filteredDevices = computed(() => {
    if (!searchQuery.value.trim()) {
      return listDevice.value
    }
    const q = searchQuery.value.toLowerCase()
    return listDevice.value.filter(
      (d) =>
        d.deviceCode.toLowerCase().includes(q) ||
        (d.room?.name ?? '').toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q),
    )
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
    editDeviceCode.value = device.deviceCode // display only
    editDescription.value = device.description
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
    sendingCommandDeviceId.value = null

    if (error) {
      snackbar.value = { show: true, text: `Failed to send ${command}`, color: 'error' }
      return
    }

    snackbar.value = {
      show: true,
      text: `${command} command sent. Waiting for device...`,
      color: 'info',
    }
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
      <v-dialog v-model="editDialogIsOpen" max-width="480">
        <v-card>
          <v-card-title class="dialog-title pa-5 pb-3"> Edit Device </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <v-form>
              <v-text-field
                :model-value="editDeviceCode"
                label="Device Code"
                density="comfortable"
                hide-details
                readonly
                disabled
                class="mb-4"
              />
              <v-textarea
                v-model="editDescription"
                label="Description"
                variant="outlined"
                density="comfortable"
                rows="3"
                auto-grow
                hide-details
                rounded="lg"
              />
            </v-form>
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
      <v-dialog v-model="confirmDialogIsOpen" max-width="400">
        <v-card>
          <v-card-text class="pa-5 text-center">
            <v-avatar color="error" variant="tonal" size="56" class="mb-4">
              <v-icon size="28">mdi-power</v-icon>
            </v-avatar>
            <h3 class="confirm-title mb-2">Power Off Device?</h3>
            <p class="text-body-2 text-medium-emphasis">
              Are you sure you want to power off
              <strong>{{ confirmDeviceCode }}</strong
              >? The device will stop accepting check-ins.
            </p>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0 justify-center ga-3">
            <v-btn
              variant="outlined"
              class="text-none font-weight-medium flex-grow-1"
              @click="confirmDialogIsOpen = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              class="text-none font-weight-medium flex-grow-1"
              prepend-icon="mdi-power"
              @click="confirmAndSendCommand"
            >
              Power Off
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
</style>
