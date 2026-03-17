<script setup lang="ts">
  import { computed, onMounted, onUnmounted } from 'vue'
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
  import CurrentClassCard from '@/components/dashboard/current-class-card.vue'
  import TodayScheduleBar from '@/components/dashboard/today-schedule-bar.vue'
  import { useAuth } from '@/composables/use-auth'
  import { useDashboardStats } from '@/composables/use-dashboard-stats'
  import { useDevices } from '@/composables/use-devices'
  import { useColorMode } from '@/composables/use-color-mode'
  import { useTodaySchedule } from '@/composables/use-today-schedule'
  import { subscribeAttendance, subscribeDevices } from '@/composables/use-realtime'
  import { formatLastSeen } from '@/utils/format'
  import { EDeviceStatus } from '@/types/database'
  import { GREETING_HOUR_MORNING, GREETING_HOUR_AFTERNOON } from '@/constants/ui'
  import {
    FONT_BODY,
    CHART_ANIMATION_DURATION,
    CHART_TENSION,
    CHART_POINT_RADIUS,
    CHART_POINT_HOVER_RADIUS,
    CHART_LEGEND_PADDING,
    DOUGHNUT_CUTOUT,
    COLOR_OPACITY_SUFFIX,
  } from '@/constants/chart'

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
  const { stats, weeklyTrend, classBreakdown, overallBreakdown, isLoading, fetchDashboardStats } =
    useDashboardStats()
  const { listDevice, fetchDevices, patchDeviceInPlace } = useDevices()
  const {
    currentClass,
    nextClass,
    listTodaySession,
    todayCheckedInTotal,
    todayStudentTotal,
    isLoading: isTodayLoading,
    fetchTodaySchedule,
  } = useTodaySchedule()

  const greeting = computed(() => {
    const name = currentUser.value?.displayName.split(' ')[0] ?? 'Teacher'
    const hour = new Date().getHours()
    if (hour < GREETING_HOUR_MORNING) {
      return `Good morning, ${name}`
    }
    if (hour < GREETING_HOUR_AFTERNOON) {
      return `Good afternoon, ${name}`
    }
    return `Good evening, ${name}`
  })

  // ── Stat cards ──

  const countOnlineDevice = computed(() =>
    listDevice.value.filter((d) => d.status === EDeviceStatus.ONLINE).length,
  )

  const todayAttendanceRate = computed(() => {
    const total = todayStudentTotal.value
    if (total === 0) {
      return 0
    }
    return Math.round((todayCheckedInTotal.value / total) * 100)
  })

  const todayClassCount = computed(() => listTodaySession.value.length)

  // ── Realtime ──

  let unsubAttendance: (() => void) | null = null
  let unsubDevices: (() => void) | null = null

  onMounted(async () => {
    await Promise.all([fetchDashboardStats(), fetchDevices(), fetchTodaySchedule()])

    unsubAttendance = subscribeAttendance(() => {
      fetchDashboardStats()
      fetchTodaySchedule()
    }).unsubscribe

    unsubDevices = subscribeDevices((payload) => {
      if (payload.new && typeof payload.new === 'object') {
        patchDeviceInPlace(payload.new)
      }
    }).unsubscribe
  })

  onUnmounted(() => {
    unsubAttendance?.()
    unsubDevices?.()
  })

  // ── Chart configs ──

  const { isDark } = useColorMode()

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
    const trend = weeklyTrend.value
    return {
      labels: trend.map((d) => d.label),
      datasets: [
        {
          label: 'On Time',
          data: trend.map((d) => d.onTime),
          borderColor: c.success,
          backgroundColor: c.success + COLOR_OPACITY_SUFFIX,
          fill: true,
          tension: CHART_TENSION,
          pointRadius: CHART_POINT_RADIUS,
          pointHoverRadius: CHART_POINT_HOVER_RADIUS,
          pointBackgroundColor: c.success,
        },
        {
          label: 'Late',
          data: trend.map((d) => d.late),
          borderColor: c.warning,
          backgroundColor: c.warning + COLOR_OPACITY_SUFFIX,
          fill: true,
          tension: CHART_TENSION,
          pointRadius: CHART_POINT_RADIUS,
          pointHoverRadius: CHART_POINT_HOVER_RADIUS,
          pointBackgroundColor: c.warning,
        },
        {
          label: 'Absent',
          data: trend.map((d) => d.absent),
          borderColor: c.error,
          backgroundColor: c.error + COLOR_OPACITY_SUFFIX,
          fill: true,
          tension: CHART_TENSION,
          pointRadius: CHART_POINT_RADIUS,
          pointHoverRadius: CHART_POINT_HOVER_RADIUS,
          pointBackgroundColor: c.error,
        },
      ],
    }
  })

  const weeklyAttendanceOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: CHART_ANIMATION_DURATION },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: FONT_BODY, size: 12 },
          color: chartColors.value.ink,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: CHART_LEGEND_PADDING,
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
    const b = overallBreakdown.value
    return {
      labels: ['On Time', 'Late', 'Absent'],
      datasets: [
        {
          data: [b.onTime, b.late, b.absent],
          backgroundColor: [c.success, c.warning, c.error],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }
  })

  const breakdownPercentages = computed(() => {
    const b = overallBreakdown.value
    const total = b.onTime + b.late + b.absent
    if (total === 0) {
      return { onTime: 0, late: 0, absent: 0 }
    }
    return {
      onTime: Math.round((b.onTime / total) * 100),
      late: Math.round((b.late / total) * 100),
      absent: Math.round((b.absent / total) * 100),
    }
  })

  const attendanceBreakdownOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: CHART_ANIMATION_DURATION },
    cutout: DOUGHNUT_CUTOUT,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: FONT_BODY, size: 12 },
          color: chartColors.value.ink,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: CHART_LEGEND_PADDING,
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
    const breakdown = classBreakdown.value
    return {
      labels: breakdown.map((b) => b.label),
      datasets: [
        {
          label: 'On Time',
          data: breakdown.map((b) => b.onTime),
          backgroundColor: c.success,
          borderRadius: 4,
        },
        {
          label: 'Late',
          data: breakdown.map((b) => b.late),
          backgroundColor: c.gold,
          borderRadius: 4,
        },
        {
          label: 'Absent',
          data: breakdown.map((b) => b.absent),
          backgroundColor: c.error,
          borderRadius: 4,
        },
      ],
    }
  })

  const classAttendanceOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: CHART_ANIMATION_DURATION },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: FONT_BODY, size: 12 },
          color: chartColors.value.ink,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: CHART_LEGEND_PADDING,
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

      <!-- Greeting -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h1 class="page-title">{{ greeting }}</h1>
          <p class="page-subtitle">Here's your class overview for today.</p>
        </v-col>
      </v-row>

      <!-- Hero: Current / Next Class -->
      <v-row class="mb-4">
        <v-col cols="12">
          <CurrentClassCard
            :current-class="currentClass"
            :next-class="nextClass"
            :list-today-session="listTodaySession"
            :today-checked-in-total="todayCheckedInTotal"
            :today-student-total="todayStudentTotal"
            :is-loading="isTodayLoading"
          />
        </v-col>
      </v-row>

      <!-- Today's Schedule -->
      <v-row class="mb-4">
        <v-col cols="12">
          <TodayScheduleBar
            :list-today-session="listTodaySession"
            :is-loading="isTodayLoading"
          />
        </v-col>
      </v-row>

      <!-- Stat cards -->
      <v-row class="mb-4" dense>
        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--total animate-in animate-delay-1 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="primary" variant="tonal" class="mr-3 stat-avatar">
                <v-icon size="22">mdi-calendar-today</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="dash-label">Today's Classes</span>
                <v-skeleton-loader v-if="isTodayLoading" type="text" width="40" />
                <span v-else class="dash-value">{{ todayClassCount }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--success animate-in animate-delay-2 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="success" variant="tonal" class="mr-3 stat-avatar">
                <v-icon size="22">mdi-account-check</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="dash-label">Checked In</span>
                <v-skeleton-loader v-if="isTodayLoading" type="text" width="40" />
                <span v-else class="dash-value text-success">{{ todayCheckedInTotal }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--warning animate-in animate-delay-3 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="info" variant="tonal" class="mr-3 stat-avatar">
                <v-icon size="22">mdi-chart-line</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="dash-label">Attendance Rate</span>
                <v-skeleton-loader v-if="isTodayLoading" type="text" width="40" />
                <span v-else class="dash-value">{{ todayAttendanceRate }}%</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--total animate-in animate-delay-4 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="secondary" variant="tonal" class="mr-3 stat-avatar">
                <v-icon size="22">mdi-chip</v-icon>
              </v-avatar>
              <div class="d-flex flex-column stat-content">
                <span class="dash-label">Devices Online</span>
                <v-skeleton-loader v-if="isLoading" type="text" width="40" />
                <span v-else class="dash-value">{{ countOnlineDevice }}/{{ stats.totalDevice }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts row 1: Weekly trend + Breakdown donut -->
      <v-row class="mb-4">
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
                  <div class="text-h6 font-weight-bold text-success">{{ breakdownPercentages.onTime }}%</div>
                  <div class="text-caption text-medium-emphasis">On Time</div>
                </div>
                <div class="text-center">
                  <div class="text-h6 font-weight-bold" style="color: var(--color-warning)">{{ breakdownPercentages.late }}%</div>
                  <div class="text-caption text-medium-emphasis">Late</div>
                </div>
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-error">{{ breakdownPercentages.absent }}%</div>
                  <div class="text-caption text-medium-emphasis">Absent</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts row 2: Per-class bar + Device status (compact) -->
      <v-row>
        <v-col cols="12" md="8">
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

        <v-col cols="12" md="4">
          <v-card class="animate-in animate-delay-5">
            <v-card-title class="card-heading pa-5 pb-3 d-flex align-center justify-space-between">
              <span>Devices</span>
              <v-chip variant="tonal" size="small" :color="countOnlineDevice > 0 ? 'success' : 'error'" class="font-weight-medium">
                {{ countOnlineDevice }}/{{ listDevice.length }} online
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-0">
              <v-list lines="two" class="pa-0">
                <template v-for="(device, index) in listDevice" :key="device.id">
                  <v-list-item class="px-5 py-3">
                    <template #prepend>
                      <v-avatar size="36" rounded="lg" color="primary" variant="tonal">
                        <v-icon size="18">mdi-chip</v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="device-list-code mb-1">
                      {{ device.deviceCode }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      <v-icon size="12" class="mr-1">mdi-map-marker-outline</v-icon>
                      {{ device.room.name }}
                      <span class="mx-1">&middot;</span>
                      {{ formatLastSeen(device.lastSeen) }}
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="d-flex align-center">
                        <span
                          class="status-dot mr-2"
                          :class="device.status === EDeviceStatus.ONLINE ? 'status-dot--online' : 'status-dot--offline'"
                        />
                        <span
                          class="text-caption font-weight-medium"
                          :class="device.status === EDeviceStatus.ONLINE ? 'text-success' : 'text-error'"
                        >
                          {{ device.status === EDeviceStatus.ONLINE ? 'Online' : 'Offline' }}
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
  color: var(--color-ink-muted);
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
