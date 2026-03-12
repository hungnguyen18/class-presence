<script setup lang="ts">
  import { ref } from 'vue'
  import AppLayout from '../components/layout/app-layout.vue'

  interface IDeviceConfig {
    id: string
    deviceCode: string
    room: string
    description: string | null
    createdAt: string
    isOnline: boolean
  }

  const listDevice = ref<IDeviceConfig[]>([
    {
      id: 'f8a3b2e1-0001-4c10-9d3b-000000000001',
      deviceCode: 'IOT-ROOM-202-01',
      room: 'Room 202',
      description: 'Attendance device for IoT Class — Group 10',
      createdAt: '2025-01-10 08:00:00',
      isOnline: true,
    },
    {
      id: 'f8a3b2e1-0001-4c10-9d3b-000000000002',
      deviceCode: 'AI-ROOM-305-01',
      room: 'Room 305',
      description: 'Attendance device for AI Class — Group 01',
      createdAt: '2025-01-11 09:00:00',
      isOnline: true,
    },
    {
      id: 'f8a3b2e1-0001-4c10-9d3b-000000000003',
      deviceCode: 'BC-ROOM-407-01',
      room: 'Room 407',
      description: 'Attendance device for Blockchain Class — Group 03',
      createdAt: '2025-01-12 10:00:00',
      isOnline: false,
    },
  ])

  const editDialogIsOpen = ref(false)

  const selectedDevice = ref<IDeviceConfig | null>(null)

  function openEditDialog({ device }: { device: IDeviceConfig }) {
    selectedDevice.value = { ...device }
    editDialogIsOpen.value = true
  }

  function closeEditDialog() {
    editDialogIsOpen.value = false
  }

  function saveDevice() {
    if (!selectedDevice.value) {
      return
    }

    const index = listDevice.value.findIndex(
      (device) => device.id === selectedDevice.value?.id,
    )

    if (index !== -1) {
      listDevice.value[index] = { ...selectedDevice.value }
    }

    editDialogIsOpen.value = false
  }
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-6" align="center" justify="space-between">
        <v-col cols="12" md="7">
          <h1 class="page-title">Devices</h1>
          <p class="page-subtitle">
            Manage IoT attendance devices across classrooms.
          </p>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-md-end">
          <v-text-field
            prepend-inner-icon="mdi-magnify"
            placeholder="Search devices..."
            density="comfortable"
            hide-details
            style="max-width: 300px"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="(device, index) in listDevice"
          :key="device.id"
          cols="12"
          sm="6"
          md="4"
          class="d-flex"
        >
          <v-card
            class="flex-grow-1 animate-in"
            :class="`animate-delay-${index + 1}`"
          >
            <v-card-text class="pa-5">
              <div class="d-flex align-center mb-4">
                <v-avatar
                  color="primary"
                  variant="tonal"
                  size="48"
                  rounded="lg"
                >
                  <v-icon size="24">mdi-chip</v-icon>
                </v-avatar>
                <div class="ml-4 flex-grow-1">
                  <div class="device-code">{{ device.deviceCode }}</div>
                  <div class="text-caption text-medium-emphasis">
                    ID: {{ device.id.slice(0, 8) }}...
                  </div>
                </div>
                <v-chip
                  :color="device.isOnline ? 'success' : 'error'"
                  variant="tonal"
                  size="x-small"
                  class="font-weight-medium"
                >
                  {{ device.isOnline ? 'Online' : 'Offline' }}
                </v-chip>
              </div>

              <v-divider class="mb-4" />

              <div class="d-flex align-center mb-3">
                <v-icon size="16" color="medium-emphasis" class="mr-2">mdi-map-marker-outline</v-icon>
                <span class="text-body-2">{{ device.room }}</span>
              </div>

              <p class="text-body-2 text-medium-emphasis mb-3">
                {{ device.description }}
              </p>

              <div class="d-flex align-center">
                <v-icon size="14" color="medium-emphasis" class="mr-1">mdi-clock-outline</v-icon>
                <span class="text-caption text-medium-emphasis">
                  Added {{ device.createdAt }}
                </span>
              </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
              <v-spacer />
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                class="text-none font-weight-medium"
                prepend-icon="mdi-pencil-outline"
                @click="openEditDialog({ device })"
              >
                Edit
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="editDialogIsOpen" max-width="480">
        <v-card>
          <v-card-title class="dialog-title pa-5 pb-3">
            Edit Device
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <v-form v-if="selectedDevice">
              <v-text-field
                v-model="selectedDevice.deviceCode"
                label="Device Code"
                density="comfortable"
                hide-details
                class="mb-4"
              />
              <v-text-field
                v-model="selectedDevice.room"
                label="Room"
                density="comfortable"
                hide-details
                class="mb-4"
              />
              <v-textarea
                v-model="selectedDevice.description"
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
            <v-btn
              variant="text"
              class="text-none"
              @click="closeEditDialog"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="text-none font-weight-medium"
              @click="saveDevice"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<style scoped>
.device-code {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ink);
}

.dialog-title {
  font-family: var(--font-display) !important;
  font-size: 1.15rem !important;
}
</style>
