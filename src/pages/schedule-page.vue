<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import { useDisplay } from 'vuetify'
  import AppLayout from '../components/layout/app-layout.vue'
  import { useSchedule } from '@/composables/use-schedule'
  import type { IScheduleSession } from '@/composables/use-schedule'
  import { LIST_DAY, LIST_DAY_SHORT, LIST_TIME_SLOT, TIME_SLOT_HEIGHT_PX, SESSION_GAP_PX } from '@/constants/schedule'

  const { listSession, isLoading, fetchSchedule } = useSchedule()

  const currentDayOfWeek = computed(() => {
    const jsDay = new Date().getDay()
    return jsDay === 0 ? 7 : jsDay
  })

  const display = useDisplay()
  const isMobile = computed(() => display.smAndDown.value)
  const viewMode = ref<'week' | 'day'>(isMobile.value ? 'day' : 'week')
  const selectedDay = ref(currentDayOfWeek.value)

  const getSessionsForDay = (day: number) =>
    listSession.value
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const getTimeSlotIndex = (time: string) =>
    LIST_TIME_SLOT.indexOf(time as (typeof LIST_TIME_SLOT)[number])

  const getSessionDuration = (session: IScheduleSession) => {
    const startIndex = getTimeSlotIndex(session.startTime)
    const endIndex = getTimeSlotIndex(session.endTime)
    return Math.max(endIndex - startIndex, 1)
  }

  const getSessionTop = (session: IScheduleSession) => {
    const startIndex = getTimeSlotIndex(session.startTime)
    return startIndex * TIME_SLOT_HEIGHT_PX
  }

  const getSessionHeight = (session: IScheduleSession) => {
    const duration = getSessionDuration(session)
    return duration * TIME_SLOT_HEIGHT_PX - SESSION_GAP_PX
  }

  const todaySessionCount = computed(() =>
    listSession.value.filter((s) => s.day === currentDayOfWeek.value).length,
  )

  const weekSessionCount = computed(() => listSession.value.length)

  const totalTeachingHour = computed(() => {
    let total = 0
    for (let i = 0; i < listSession.value.length; i += 1) {
      const session = listSession.value[i]
      if (session) {
        total += getSessionDuration(session)
      }
    }
    return total
  })

  const uniqueCourseCount = computed(() => {
    const codes = new Set(listSession.value.map((s) => s.classCode))
    return codes.size
  })

  const listVisibleDay = computed(() => {
    if (viewMode.value === 'day') {
      return [selectedDay.value]
    }
    return [1, 2, 3, 4, 5, 6]
  })

  const isCurrentTimeSlot = (timeSlot: string) => {
    const now = new Date()
    const hour = now.getHours()
    const slotHour = parseInt(timeSlot.split(':')[0] ?? '0', 10)
    return hour === slotHour && currentDayOfWeek.value <= 6
  }

  onMounted(() => {
    fetchSchedule()
  })
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-6" align="center">
        <v-col cols="12" md="6">
          <h1 class="page-title">Schedule</h1>
          <p class="page-subtitle">
            Weekly timetable and upcoming sessions.
          </p>
        </v-col>
        <v-col cols="12" md="6" class="d-flex justify-md-end align-center ga-3">
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            density="comfortable"
            rounded="lg"
            color="primary"
            variant="outlined"
          >
            <v-btn value="week" size="small" class="text-none font-weight-medium">
              <v-icon start size="16">mdi-calendar-week</v-icon>
              Week
            </v-btn>
            <v-btn value="day" size="small" class="text-none font-weight-medium">
              <v-icon start size="16">mdi-calendar-today</v-icon>
              Day
            </v-btn>
          </v-btn-toggle>

          <v-select
            v-if="viewMode === 'day'"
            v-model="selectedDay"
            :items="LIST_DAY.map((name, i) => ({ title: name, value: i + 1 }))"
            density="comfortable"
            hide-details
            style="max-width: 180px"
          />
        </v-col>
      </v-row>

      <!-- Stats row -->
      <v-row class="mb-6" dense>
        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--total animate-in animate-delay-1 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="primary" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-calendar-today</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis stat-label">Today</span>
                <span class="stat-value">{{ todaySessionCount }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--success animate-in animate-delay-2 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="success" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-calendar-week</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis stat-label">This Week</span>
                <span class="stat-value text-success">{{ weekSessionCount }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--warning animate-in animate-delay-3 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="secondary" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-clock-outline</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis stat-label">Hours</span>
                <span class="stat-value">{{ totalTeachingHour }}h</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3" class="d-flex">
          <v-card class="stat-card stat-card--total animate-in animate-delay-4 flex-grow-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="info" variant="tonal" class="mr-3 mr-sm-4 stat-avatar">
                <v-icon size="22">mdi-book-open-variant</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis stat-label">Courses</span>
                <span class="stat-value">{{ uniqueCourseCount }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Timetable grid -->
      <v-card class="animate-in animate-delay-3">
        <v-card-text v-if="isLoading" class="pa-8 text-center">
          <v-progress-circular indeterminate color="primary" />
        </v-card-text>
        <v-card-text v-else class="pa-0">
          <div class="timetable-wrapper">
            <div class="timetable" :class="{ 'timetable--day-view': viewMode === 'day' }">
              <!-- Header row -->
              <div class="timetable-header">
                <div class="timetable-time-col timetable-corner" />
                <div
                  v-for="day in listVisibleDay"
                  :key="day"
                  class="timetable-day-col timetable-day-header"
                  :class="{ 'timetable-day-header--today': day === currentDayOfWeek }"
                >
                  <span class="day-label-short d-sm-none">{{ LIST_DAY_SHORT[day - 1] }}</span>
                  <span class="day-label-full d-none d-sm-inline">{{ LIST_DAY[day - 1] }}</span>
                  <v-chip
                    v-if="day === currentDayOfWeek"
                    size="x-small"
                    color="secondary"
                    variant="flat"
                    class="ml-2 font-weight-bold"
                  >
                    Today
                  </v-chip>
                </div>
              </div>

              <!-- Body -->
              <div class="timetable-body">
                <!-- Time labels column -->
                <div class="timetable-time-col">
                  <div
                    v-for="slot in LIST_TIME_SLOT"
                    :key="slot"
                    class="timetable-time-slot"
                    :class="{ 'timetable-time-slot--current': isCurrentTimeSlot(slot) }"
                  >
                    <span class="time-label">{{ slot }}</span>
                  </div>
                </div>

                <!-- Day columns -->
                <div
                  v-for="day in listVisibleDay"
                  :key="day"
                  class="timetable-day-col"
                  :class="{ 'timetable-day-col--today': day === currentDayOfWeek }"
                >
                  <!-- Grid lines -->
                  <div
                    v-for="slot in LIST_TIME_SLOT"
                    :key="slot"
                    class="timetable-grid-line"
                    :class="{ 'timetable-grid-line--current': isCurrentTimeSlot(slot) && day === currentDayOfWeek }"
                  />

                  <!-- Session blocks -->
                  <div
                    v-for="session in getSessionsForDay(day)"
                    :key="session.id"
                    class="session-block"
                    :style="{
                      top: `${getSessionTop(session)}px`,
                      height: `${getSessionHeight(session)}px`,
                    }"
                  >
                    <div class="session-card" :class="`session-card--${session.color}`">
                      <div class="session-time">
                        {{ session.startTime }} — {{ session.endTime }}
                      </div>
                      <div class="session-name">{{ session.className }}</div>
                      <div class="session-code">{{ session.classCode }}</div>
                      <div class="session-meta">
                        <v-icon size="11">mdi-map-marker-outline</v-icon>
                        {{ session.room }}
                        <span class="mx-1">&middot;</span>
                        <v-icon size="11">mdi-account-group-outline</v-icon>
                        {{ session.studentCount }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<style scoped>
.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.15rem;
  line-height: 1.3;
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

  .stat-label {
    font-size: 0.62rem;
  }

  .stat-value {
    font-size: 1rem;
  }
}

/* ── Timetable Layout ── */

.timetable-wrapper {
  overflow-x: auto;
}

.timetable {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 720px;
}

.timetable-header {
  display: grid;
  grid-template-columns: 64px repeat(6, 1fr);
  border-bottom: 2px solid var(--color-border);
}

.timetable--day-view .timetable-header {
  grid-template-columns: 64px 1fr;
}

.timetable-body {
  display: grid;
  grid-template-columns: 64px repeat(6, 1fr);
  position: relative;
}

.timetable--day-view .timetable-body {
  grid-template-columns: 64px 1fr;
}

.timetable-corner {
  border-right: 1px solid var(--color-border);
}

/* ── Day Header ── */

.timetable-day-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-right: 1px solid var(--color-border);
}

.timetable-day-header:last-child {
  border-right: none;
}

.timetable-day-header--today {
  color: var(--color-ink);
  background-color: var(--color-accent-gold-soft);
}

/* ── Time Column ── */

.timetable-time-col {
  border-right: 1px solid var(--color-border);
}

.timetable-time-slot {
  height: 72px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
}

.timetable-time-slot--current {
  background-color: var(--color-accent-gold-soft);
}

.time-label {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  letter-spacing: 0.02em;
}

/* ── Day Column ── */

.timetable-day-col {
  position: relative;
  border-right: 1px solid var(--color-border);
}

.timetable-day-col:last-child {
  border-right: none;
}

.timetable-day-col--today {
  background-color: var(--color-accent-gold-soft);
}

.timetable-grid-line {
  height: 72px;
  border-bottom: 1px solid var(--color-border);
}

.timetable-grid-line:last-child {
  border-bottom: none;
}

.timetable-grid-line--current {
  background-color: rgba(212, 168, 83, 0.06);
}

/* ── Session Block ── */

.session-block {
  position: absolute;
  left: 3px;
  right: 3px;
  z-index: 1;
}

.session-card {
  height: 100%;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.session-card:hover {
  filter: brightness(0.95);
}

.session-card--info {
  background-color: rgba(74, 127, 165, 0.12);
  border-left-color: var(--color-ink-muted);
  color: var(--color-ink);
}

.session-card--secondary {
  background-color: var(--color-accent-gold-soft);
  border-left-color: var(--color-accent-gold);
  color: var(--color-ink);
}

.session-card--primary {
  background-color: rgba(44, 62, 80, 0.08);
  border-left-color: var(--color-ink);
  color: var(--color-ink);
}

.session-time {
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.7;
}

.session-name {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-code {
  font-family: var(--font-body);
  font-size: 0.6rem;
  font-weight: 500;
  opacity: 0.55;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-body);
  font-size: 0.68rem;
  opacity: 0.65;
}
</style>
