<script setup lang="ts">
  import { ref } from 'vue'
  import AppLayout from '../components/layout/app-layout.vue'

  interface IDeviceConfig {
    id: string
    deviceCode: string
    room: string
    description: string | null
    createdAt: string
  }

  const listDevice = ref<IDeviceConfig[]>([
    {
      id: 'f8a3b2e1-0001-4c10-9d3b-000000000001',
      deviceCode: 'IOT-ROOM-202-01',
      room: 'P.202',
      description: 'Thiết bị điểm danh lớp IoT - Nhóm 10',
      createdAt: '2025-01-10 08:00:00',
    },
    {
      id: 'f8a3b2e1-0001-4c10-9d3b-000000000002',
      deviceCode: 'AI-ROOM-305-01',
      room: 'P.305',
      description: 'Thiết bị điểm danh lớp AI - Nhóm 01',
      createdAt: '2025-01-11 09:00:00',
    },
    {
      id: 'f8a3b2e1-0001-4c10-9d3b-000000000003',
      deviceCode: 'BC-ROOM-407-01',
      room: 'P.407',
      description: 'Thiết bị điểm danh lớp Blockchain - Nhóm 03',
      createdAt: '2025-01-12 10:00:00',
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
    <v-container fluid class="pa-4 pa-sm-6">
      <v-row class="mb-4" align="center" justify="space-between">
        <v-col cols="12" md="7">
          <h1 class="text-h5 text-sm-h4 font-weight-medium mb-1">
            Cấu hình thiết bị điểm danh
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            Danh sách thiết bị IoT dùng cho hệ thống điểm danh. Dữ liệu chỉ là dummy để thiết kế UI,
            chưa kết nối cơ sở dữ liệu.
          </p>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-end">
          <v-text-field
            prepend-inner-icon="mdi-magnify"
            label="Tìm kiếm theo mã thiết bị hoặc phòng"
            density="comfortable"
            variant="outlined"
            hide-details
            style="max-width: 320px"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="device in listDevice"
          :key="device.id"
          cols="12"
          sm="6"
          md="4"
          class="d-flex"
        >
          <v-card
            rounded="lg"
            class="flex-grow-1"
            variant="elevated"
            elevation="2"
          >
            <v-card-item>
              <div class="d-flex align-center">
                <v-avatar color="primary" variant="tonal" size="40">
                  <v-icon>mdi-chip</v-icon>
                </v-avatar>
                <div class="ml-4">
                  <div class="text-body-2 text-uppercase text-medium-emphasis">
                    {{ device.deviceCode }}
                  </div>
                  <div class="text-caption text-disabled">
                    ID: {{ device.id.slice(0, 8) }}…
                  </div>
                </div>
              </div>
            </v-card-item>

            <v-card-text>
              <div class="mb-2">
                <v-chip
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="text-caption"
                >
                  <v-icon start size="16">mdi-door</v-icon>
                  Phòng {{ device.room }}
                </v-chip>
              </div>
              <p class="text-body-2 mb-2">
                {{ device.description }}
              </p>
              <p class="text-caption text-medium-emphasis">
                <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                Tạo lúc: {{ device.createdAt }}
              </p>
            </v-card-text>

            <v-card-actions class="justify-end">
              <v-btn
                color="primary"
                variant="text"
                size="small"
                class="text-none"
                @click="openEditDialog({ device })"
              >
                Cập nhật cấu hình
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="editDialogIsOpen" max-width="480">
        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-medium">
            Cập nhật cấu hình thiết bị
          </v-card-title>
          <v-card-text>
            <v-form v-if="selectedDevice">
              <v-text-field
                v-model="selectedDevice.deviceCode"
                label="Mã thiết bị"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              />
              <v-text-field
                v-model="selectedDevice.room"
                label="Phòng"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              />
              <v-textarea
                v-model="selectedDevice.description"
                label="Mô tả"
                variant="outlined"
                density="comfortable"
                rows="3"
                auto-grow
                hide-details
              />
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn variant="text" class="text-none" @click="closeEditDialog">
              Hủy
            </v-btn>
            <v-btn color="primary" variant="flat" class="text-none" @click="saveDevice">
              Lưu tạm
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

