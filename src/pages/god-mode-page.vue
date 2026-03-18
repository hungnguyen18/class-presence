<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import AppLayout from '../components/layout/app-layout.vue'
  import { invokeEdgeFunction } from '@/lib/supabase'

  type TDbCounts = {
    room: number
    class: number
    student: number
    device: number
    attendanceLog: number
    attendanceSession: number
  }

  type TSeedResponse = {
    success: boolean
    message: string
    counts?: TDbCounts
  }

  const mssvInput = ref('123456789\n987654321\n24810113')
  const isClearing = ref(false)
  const isSeeding = ref(false)
  const isLoadingCounts = ref(false)
  const showClearDialog = ref(false)
  const showSeedDialog = ref(false)
  const statusMessage = ref('')
  const statusType = ref<'success' | 'error' | 'info'>('info')
  const dbCounts = ref<TDbCounts | null>(null)

  const parsedListMssv = computed(() =>
    mssvInput.value
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  )

  const isWorking = computed(() => isClearing.value || isSeeding.value)

  const listCountItem = computed(() => {
    if (!dbCounts.value) {
      return []
    }
    return [
      { label: 'Rooms', value: dbCounts.value.room, icon: 'mdi-door', color: 'primary' },
      {
        label: 'Classes',
        value: dbCounts.value.class,
        icon: 'mdi-book-open-variant',
        color: 'secondary',
      },
      {
        label: 'Students',
        value: dbCounts.value.student,
        icon: 'mdi-account-group',
        color: 'info',
      },
      {
        label: 'Devices',
        value: dbCounts.value.device,
        icon: 'mdi-chip',
        color: 'success',
      },
      {
        label: 'Attendance Logs',
        value: dbCounts.value.attendanceLog,
        icon: 'mdi-clipboard-check',
        color: 'warning',
      },
      {
        label: 'Sessions',
        value: dbCounts.value.attendanceSession,
        icon: 'mdi-clock-check',
        color: 'error',
      },
    ]
  })

  const fetchDbCounts = async () => {
    isLoadingCounts.value = true
    const { data, error } = await invokeEdgeFunction<TSeedResponse>('admin-seed', {
      action: 'counts',
    })
    if (error || !data?.success) {
      statusMessage.value = error ?? data?.message ?? 'Failed to fetch counts'
      statusType.value = 'error'
    } else if (data.counts) {
      dbCounts.value = data.counts
    }
    isLoadingCounts.value = false
  }

  const handleClear = async () => {
    showClearDialog.value = false
    isClearing.value = true
    statusMessage.value = ''

    const { data, error } = await invokeEdgeFunction<TSeedResponse>('admin-seed', {
      action: 'clear',
    })

    if (error || !data?.success) {
      statusMessage.value = error ?? data?.message ?? 'Clear failed'
      statusType.value = 'error'
    } else {
      statusMessage.value = data.message
      statusType.value = 'success'
    }

    isClearing.value = false
    await fetchDbCounts()
  }

  const handleSeed = async () => {
    showSeedDialog.value = false
    isSeeding.value = true
    statusMessage.value = ''

    const { data, error } = await invokeEdgeFunction<TSeedResponse>('admin-seed', {
      action: 'seed',
      listMssv: parsedListMssv.value,
    })

    if (error || !data?.success) {
      statusMessage.value = error ?? data?.message ?? 'Seed failed'
      statusType.value = 'error'
    } else {
      statusMessage.value = data.message
      statusType.value = 'success'
    }

    isSeeding.value = false
    await fetchDbCounts()
  }

  onMounted(() => {
    fetchDbCounts()
  })
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8" style="max-width: 860px">
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="page-title">God Mode</h1>
          <p class="page-subtitle">Admin tools for demo data management.</p>
        </v-col>
      </v-row>

      <!-- Progress bar -->
      <v-progress-linear v-if="isWorking" indeterminate color="secondary" class="mb-4" />

      <!-- Status alert -->
      <v-alert
        v-if="statusMessage"
        :type="statusType"
        variant="tonal"
        closable
        class="mb-6 animate-in"
        @click:close="statusMessage = ''"
      >
        {{ statusMessage }}
      </v-alert>

      <!-- DB Counts -->
      <v-card class="mb-6 animate-in animate-delay-1">
        <v-card-text class="pa-5">
          <div class="d-flex align-center justify-space-between mb-4">
            <div
              class="text-body-2 font-weight-bold text-uppercase"
              style="letter-spacing: 0.04em"
            >
              Database Status
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :loading="isLoadingCounts"
              prepend-icon="mdi-refresh"
              class="text-none"
              @click="fetchDbCounts"
            >
              Refresh
            </v-btn>
          </div>

          <div v-if="isLoadingCounts && !dbCounts" class="text-center py-4">
            <v-progress-circular indeterminate color="primary" size="24" />
          </div>

          <div v-else-if="dbCounts" class="d-flex flex-wrap ga-3">
            <v-chip
              v-for="item in listCountItem"
              :key="item.label"
              :color="item.color"
              variant="tonal"
              size="default"
              :prepend-icon="item.icon"
            >
              {{ item.label }}: {{ item.value }}
            </v-chip>
          </div>

          <div v-else class="text-medium-emphasis text-body-2">
            Could not load counts.
          </div>
        </v-card-text>
      </v-card>

      <!-- MSSV Input -->
      <v-card class="mb-6 animate-in animate-delay-2">
        <v-card-text class="pa-5">
          <div
            class="text-body-2 font-weight-bold text-uppercase mb-3"
            style="letter-spacing: 0.04em"
          >
            MSSV for Live Demo Class (IOT301)
          </div>
          <v-textarea
            v-model="mssvInput"
            variant="outlined"
            rows="4"
            placeholder="Enter MSSVs, one per line or comma-separated"
            hide-details
            class="mb-2"
          />
          <v-chip size="small" color="info" variant="tonal">
            Parsed: {{ parsedListMssv.length }} MSSVs
          </v-chip>
        </v-card-text>
      </v-card>

      <!-- Actions -->
      <v-card class="animate-in animate-delay-3">
        <v-card-text class="pa-5">
          <div
            class="text-body-2 font-weight-bold text-uppercase mb-4"
            style="letter-spacing: 0.04em"
          >
            Actions
          </div>
          <div class="d-flex ga-4 flex-wrap">
            <v-btn
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete-sweep"
              class="text-none font-weight-medium"
              :loading="isClearing"
              :disabled="isWorking"
              @click="showClearDialog = true"
            >
              Clear All Data
            </v-btn>
            <v-btn
              color="success"
              variant="tonal"
              prepend-icon="mdi-database-plus"
              class="text-none font-weight-medium"
              :loading="isSeeding"
              :disabled="isWorking || parsedListMssv.length === 0"
              @click="showSeedDialog = true"
            >
              Generate Demo Data
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Clear Confirmation Dialog -->
      <v-dialog v-model="showClearDialog" max-width="420">
        <v-card>
          <v-card-title class="text-h6 pa-5 pb-2"> Clear All Data? </v-card-title>
          <v-card-text class="px-5">
            This will permanently delete ALL data from all tables (rooms, classes,
            students, devices, attendance logs). This action cannot be undone.
          </v-card-text>
          <v-card-actions class="pa-5 pt-2">
            <v-spacer />
            <v-btn variant="text" class="text-none" @click="showClearDialog = false">
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              class="text-none font-weight-medium"
              @click="handleClear"
            >
              Clear Everything
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Seed Confirmation Dialog -->
      <v-dialog v-model="showSeedDialog" max-width="420">
        <v-card>
          <v-card-title class="text-h6 pa-5 pb-2"> Generate Demo Data? </v-card-title>
          <v-card-text class="px-5">
            This will create demo data: 4 rooms, 5 classes, 3 devices, and students across
            all classes. The live demo class (IOT301) will have
            <strong>{{ parsedListMssv.length }} students</strong>
            with the MSSVs you provided.
          </v-card-text>
          <v-card-actions class="pa-5 pt-2">
            <v-spacer />
            <v-btn variant="text" class="text-none" @click="showSeedDialog = false">
              Cancel
            </v-btn>
            <v-btn
              color="success"
              variant="flat"
              class="text-none font-weight-medium"
              @click="handleSeed"
            >
              Seed Data
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>
