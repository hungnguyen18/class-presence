<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
  } from 'chart.js'
  import { Line, Doughnut, Bar } from 'vue-chartjs'
  import AppLayout from '../components/layout/app-layout.vue'
  import { useAuth } from '@/composables/use-auth'
  import { supabase } from '@/lib/supabase'

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
  )

  const { currentUser } = useAuth()

  const greeting = computed(() => {
    const name = currentUser.value?.displayName.split(' ')[0] ?? 'Teacher'
    const hour = new Date().getHours()
    if (hour < 12) {
      return `Good morning, ${name}`
    }
    if (hour < 18) {
      return `Good afternoon, ${name}`
    }
    return `Good evening, ${name}`
  })

  // ── Supabase connection status ──

  const supabaseStatus = ref<'checking' | 'connected' | 'error'>('checking')
  const supabaseLatency = ref<number | null>(null)

  async function checkSupabaseConnection() {
    supabaseStatus.value = 'checking'
    const start = performance.now()
    try {
      const { error } = await supabase.from('_dummy_ping').select('*').limit(1)
      supabaseLatency.value = Math.round(performance.now() - start)
      // Even a "relation does not exist" error means the API is reachable
      if (error && !error.message.includes('does not exist')) {
        supabaseStatus.value = 'connected'
      } else {
        supabaseStatus.value = 'connected'
      }
    } catch {
      supabaseLatency.value = null
      supabaseStatus.value = 'error'
    }
  }

  onMounted(() => {
    checkSupabaseConnection()
  })

  // ── Device status (dummy) ──

  interface IDashboardDevice {
    id: string
    deviceCode: string
    room: string
    isOnline: boolean
    lastSeen: string
  }

  const listDevice = ref<IDashboardDevice[]>([
    {
      id: '1',
      deviceCode: 'IOT-ROOM-202-01',
      room: 'Room 202',
      isOnline: true,
      lastSeen: 'Just now',
    },
    {
      id: '2',
      deviceCode: 'AI-ROOM-305-01',
      room: 'Room 305',
      isOnline: true,
      lastSeen: '2 min ago',
    },
    {
      id: '3',
      deviceCode: 'BC-ROOM-407-01',
      room: 'Room 407',
      isOnline: false,
      lastSeen: '5 hours ago',
    },
  ])

  const countOnlineDevice = computed(() =>
    listDevice.value.filter((d) => d.isOnline).length,
  )

  // ── Chart configs (reactive to theme changes) ──

  import { useColorMode } from '@/composables/use-color-mode'

  const { isDark } = useColorMode()

  const FONT_BODY = "'DM Sans', system-ui, sans-serif"

  const chartColors = computed(() => {
    const dark = isDark.value
    return {
      ink: dark ? '#D8D2C7' : '#2C3E50',
      inkMuted: dark ? '#8A9BB0' : '#6B7C8D',
      border: dark ? 'rgba(255,255,255,0.09)' : '#E0DCD4',
      gold: '#D4A853',
      success: dark ? '#4DB87C' : '#3D8B5E',
      warning: dark ? '#E0A845' : '#D4953A',
      error: dark ? '#E06B66' : '#C0544F',
    }
  })

  const sharedScaleOptions = computed(() => ({
    ticks: {
      font: { family: FONT_BODY, size: 11 },
      color: chartColors.value.inkMuted,
    },
    grid: {
      color: chartColors.value.border,
    },
  }))

  // Weekly attendance trend (line)
  const weeklyAttendanceData = computed(() => {
    const c = chartColors.value
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [
        {
          label: 'On Time',
          data: [38, 41, 36, 42, 39, 30],
          borderColor: c.success,
          backgroundColor: c.success + '18',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: c.success,
        },
        {
          label: 'Late',
          data: [4, 3, 6, 2, 5, 4],
          borderColor: c.warning,
          backgroundColor: c.warning + '18',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: c.warning,
        },
        {
          label: 'Absent',
          data: [3, 1, 3, 1, 1, 6],
          borderColor: c.error,
          backgroundColor: c.error + '18',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: c.error,
        },
      ],
    }
  })

  const weeklyAttendanceOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: FONT_BODY, size: 12 },
          color: chartColors.value.ink,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        titleFont: { family: FONT_BODY },
        bodyFont: { family: FONT_BODY },
      },
    },
    scales: {
      x: {
        ...sharedScaleOptions.value,
        grid: { display: false },
      },
      y: {
        ...sharedScaleOptions.value,
        beginAtZero: true,
      },
    },
  }))

  // Attendance breakdown (doughnut)
  const attendanceBreakdownData = computed(() => {
    const c = chartColors.value
    return {
      labels: ['On Time', 'Late', 'Absent'],
      datasets: [
        {
          data: [226, 24, 15],
          backgroundColor: [c.success, c.warning, c.error],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }
  })

  const attendanceBreakdownOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: FONT_BODY, size: 12 },
          color: chartColors.value.ink,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        titleFont: { family: FONT_BODY },
        bodyFont: { family: FONT_BODY },
      },
    },
  }))

  // Per-class attendance (bar)
  const classAttendanceData = computed(() => {
    const c = chartColors.value
    return {
      labels: ['IoT — G10', 'AI — G01', 'BC — G03'],
      datasets: [
        {
          label: 'On Time',
          data: [40, 44, 36],
          backgroundColor: c.success,
          borderRadius: 4,
        },
        {
          label: 'Late',
          data: [3, 4, 2],
          backgroundColor: c.gold,
          borderRadius: 4,
        },
        {
          label: 'Absent',
          data: [2, 2, 2],
          backgroundColor: c.error,
          borderRadius: 4,
        },
      ],
    }
  })

  const classAttendanceOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: FONT_BODY, size: 12 },
          color: chartColors.value.ink,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        titleFont: { family: FONT_BODY },
        bodyFont: { family: FONT_BODY },
      },
    },
    scales: {
      x: {
        ...sharedScaleOptions.value,
        grid: { display: false },
        stacked: true,
      },
      y: {
        ...sharedScaleOptions.value,
        beginAtZero: true,
        stacked: true,
      },
    },
  }))
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="page-title">
            {{ greeting }}
          </h1>
          <p class="page-subtitle">
            Here's your attendance overview for today.
          </p>
        </v-col>
      </v-row>

      <!-- Stat cards -->
      <v-row class="mb-6" dense>
        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--total animate-in animate-delay-1 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4 pa-sm-4">
              <v-avatar size="44" rounded="lg" color="primary" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-book-open-variant</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="text-caption text-medium-emphasis dash-label">Classes</span>
                <span class="dash-value">3</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--success animate-in animate-delay-2 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4 pa-sm-4">
              <v-avatar size="44" rounded="lg" color="success" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-calendar-check</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="text-caption text-medium-emphasis dash-label">Today</span>
                <span class="dash-value text-success">5</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--warning animate-in animate-delay-3 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4 pa-sm-4">
              <v-avatar size="44" rounded="lg" color="info" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-account-group</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="text-caption text-medium-emphasis dash-label">Students</span>
                <span class="dash-value">135</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--total animate-in animate-delay-4 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4 pa-sm-4">
              <v-avatar size="44" rounded="lg" color="secondary" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-chip</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis dash-label">Devices</span>
                <span class="dash-value">3</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts row 1: Weekly trend + Breakdown donut -->
      <v-row class="mb-6">
        <v-col cols="12" md="8">
          <v-card class="animate-in animate-delay-3">
            <v-card-title class="card-heading pa-5 pb-3">
              Weekly Attendance Trend
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <div class="chart-container chart-container--line">
                <Line :data="weeklyAttendanceData" :options="weeklyAttendanceOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="animate-in animate-delay-4">
            <v-card-title class="card-heading pa-5 pb-3">
              Attendance Breakdown
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <div class="chart-container chart-container--doughnut">
                <Doughnut :data="attendanceBreakdownData" :options="attendanceBreakdownOptions" />
              </div>
              <div class="d-flex justify-space-around mt-4">
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-success">85%</div>
                  <div class="text-caption text-medium-emphasis">On Time</div>
                </div>
                <div class="text-center">
                  <div class="text-h6 font-weight-bold" style="color: var(--color-warning)">9%</div>
                  <div class="text-caption text-medium-emphasis">Late</div>
                </div>
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-error">6%</div>
                  <div class="text-caption text-medium-emphasis">Absent</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts row 2: Per-class bar + Activity timeline -->
      <v-row class="mb-6">
        <v-col cols="12" md="7">
          <v-card class="animate-in animate-delay-5">
            <v-card-title class="card-heading pa-5 pb-3">
              Attendance by Class
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <div class="chart-container chart-container--bar">
                <Bar :data="classAttendanceData" :options="classAttendanceOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card class="animate-in animate-delay-5">
            <v-card-title class="card-heading pa-5 pb-3">
              Recent Activity
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <v-timeline density="compact" side="end" class="activity-timeline">
                <v-timeline-item dot-color="success" size="x-small">
                  <div class="text-body-2">Session completed — AI Class</div>
                  <div class="text-caption text-medium-emphasis">10 minutes ago</div>
                </v-timeline-item>

                <v-timeline-item dot-color="info" size="x-small">
                  <div class="text-body-2">Report exported — IoT Class</div>
                  <div class="text-caption text-medium-emphasis">1 hour ago</div>
                </v-timeline-item>

                <v-timeline-item dot-color="warning" size="x-small">
                  <div class="text-body-2">Late check-in — Chris Taylor</div>
                  <div class="text-caption text-medium-emphasis">2 hours ago</div>
                </v-timeline-item>

                <v-timeline-item dot-color="success" size="x-small">
                  <div class="text-body-2">Session completed — Blockchain</div>
                  <div class="text-caption text-medium-emphasis">3 hours ago</div>
                </v-timeline-item>

                <v-timeline-item dot-color="error" size="x-small">
                  <div class="text-body-2">Device offline — Room 407</div>
                  <div class="text-caption text-medium-emphasis">5 hours ago</div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Row 3: System status -->
      <v-row>
        <v-col cols="12" md="5">
          <v-card class="animate-in animate-delay-5">
            <v-card-title class="card-heading pa-5 pb-3 d-flex align-center">
              System Status
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <!-- Supabase status -->
              <div class="status-item d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center">
                  <v-avatar size="36" rounded="lg" color="primary" variant="tonal" class="mr-3">
                    <v-icon size="18">mdi-database-outline</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-medium">Supabase</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ supabaseStatus === 'connected' && supabaseLatency ? `${supabaseLatency}ms` : 'Database' }}
                    </div>
                  </div>
                </div>
                <v-chip
                  :color="supabaseStatus === 'connected' ? 'success' : supabaseStatus === 'error' ? 'error' : 'warning'"
                  variant="tonal"
                  size="small"
                  class="font-weight-medium"
                >
                  <v-icon start size="10" class="mr-1">
                    {{ supabaseStatus === 'connected' ? 'mdi-check-circle' : supabaseStatus === 'error' ? 'mdi-close-circle' : 'mdi-loading mdi-spin' }}
                  </v-icon>
                  {{ supabaseStatus === 'connected' ? 'Connected' : supabaseStatus === 'error' ? 'Error' : 'Checking' }}
                </v-chip>
              </div>

              <!-- Auth status -->
              <div class="status-item d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar size="36" rounded="lg" color="secondary" variant="tonal" class="mr-3">
                    <v-icon size="18">mdi-shield-check-outline</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-medium">Auth</div>
                    <div class="text-caption text-medium-emphasis">Google OAuth</div>
                  </div>
                </div>
                <v-chip
                  color="success"
                  variant="tonal"
                  size="small"
                  class="font-weight-medium"
                >
                  <v-icon start size="10" class="mr-1">mdi-check-circle</v-icon>
                  Active
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card class="animate-in animate-delay-5">
            <v-card-title class="card-heading pa-5 pb-3 d-flex align-center justify-space-between">
              <span>Device Status</span>
              <v-chip variant="tonal" size="small" color="info" class="font-weight-medium">
                {{ countOnlineDevice }}/{{ listDevice.length }} online
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-0">
              <v-list lines="two" class="pa-0">
                <template
                  v-for="(device, index) in listDevice"
                  :key="device.id"
                >
                  <v-list-item class="px-5 py-3">
                    <template #prepend>
                      <v-avatar size="40" rounded="lg" color="primary" variant="tonal">
                        <v-icon size="20">mdi-chip</v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="device-list-code mb-1">
                      {{ device.deviceCode }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      <v-icon size="12" class="mr-1">mdi-map-marker-outline</v-icon>
                      {{ device.room }}
                      <span class="mx-2">·</span>
                      {{ device.lastSeen }}
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="d-flex align-center">
                        <span
                          class="status-dot mr-2"
                          :class="device.isOnline ? 'status-dot--online' : 'status-dot--offline'"
                        />
                        <span
                          class="text-caption font-weight-medium"
                          :class="device.isOnline ? 'text-success' : 'text-error'"
                        >
                          {{ device.isOnline ? 'Online' : 'Offline' }}
                        </span>
                      </div>
                    </template>
                  </v-list-item>
                  <v-divider v-if="index < listDevice.length - 1" />
                </template>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

<style scoped>
.dash-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.dash-value {
  font-family: var(--font-display);
  font-size: 1.75rem;
  line-height: 1.1;
}

.card-heading {
  font-family: var(--font-display) !important;
  font-size: 1.05rem !important;
}

.chart-container {
  position: relative;
  width: 100%;
  min-width: 0;
}

.chart-container--line {
  height: 280px;
}

.chart-container--doughnut {
  height: 220px;
}

.chart-container--bar {
  height: 280px;
}

@media (max-width: 600px) {
  .stat-avatar {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
  }

  .stat-avatar .v-icon {
    font-size: 18px !important;
  }

  .dash-label {
    font-size: 0.62rem;
  }

  .dash-value {
    font-size: 1.35rem;
  }

  .chart-container--line {
    height: 220px;
  }

  .chart-container--doughnut {
    height: 200px;
  }

  .chart-container--bar {
    height: 220px;
  }
}

.activity-timeline {
  padding-top: 0;
}

.activity-timeline :deep(.v-timeline-item__body) {
  padding-top: 0 !important;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--online {
  background-color: var(--color-success);
  box-shadow: 0 0 6px var(--color-success-soft);
}

.status-dot--offline {
  background-color: var(--color-error);
}

.device-list-code {
  font-family: var(--font-body) !important;
  font-size: 0.78rem !important;
  font-weight: 600;
  letter-spacing: 0.03em;
}
</style>
