<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import type { ITodaySession } from '@/composables/use-today-schedule'
  import dayjs from 'dayjs'

  const props = defineProps<{
    currentClass: ITodaySession | null
    nextClass: ITodaySession | null
    listTodaySession: ITodaySession[]
    todayCheckedInTotal: number
    todayStudentTotal: number
    isLoading: boolean
  }>()

  const router = useRouter()

  type TCardState = 'live' | 'next' | 'done' | 'empty'

  const cardState = computed<TCardState>(() => {
    if (props.isLoading) {
      return 'empty'
    }
    if (props.currentClass) {
      return 'live'
    }
    if (props.nextClass) {
      return 'next'
    }
    if (props.listTodaySession.length > 0) {
      return 'done'
    }
    return 'empty'
  })

  const progressPercent = computed(() => {
    if (!props.currentClass || props.currentClass.studentCount === 0) {
      return 0
    }
    return Math.round(
      (props.currentClass.checkedInCount / props.currentClass.studentCount) * 100,
    )
  })

  const minutesUntilNext = computed(() => {
    if (!props.nextClass) {
      return 0
    }
    const now = dayjs()
    const start = dayjs(`${now.format('YYYY-MM-DD')} ${props.nextClass.startTime}`)
    return start.diff(now, 'minute')
  })

  const completedCount = computed(
    () => props.listTodaySession.filter((s) => s.isPast).length,
  )

  function navigateToClass(classId: string) {
    router.push({ name: 'classDashboard', params: { classId } })
  }
</script>

<template>
  <v-card class="current-class-card" :class="`current-class-card--${cardState}`">
    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <v-card-text class="pa-6">
        <v-skeleton-loader type="heading, text, text" />
      </v-card-text>
    </template>

    <!-- LIVE state -->
    <template v-else-if="cardState === 'live' && currentClass">
      <div class="card-accent card-accent--live" />
      <v-card-text class="pa-5 pa-sm-6">
        <div class="d-flex align-start justify-space-between mb-1">
          <div class="d-flex align-center ga-3">
            <span class="live-badge">
              <span class="live-dot" />
              LIVE
            </span>
            <span class="class-subject">{{ currentClass.className }}</span>
          </div>
          <v-icon size="28" :color="currentClass.color">{{ currentClass.icon }}</v-icon>
        </div>

        <div class="class-meta mb-4">
          <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
          {{ currentClass.room }}
          <span class="mx-2 text-medium-emphasis">·</span>
          <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
          {{ currentClass.startTime }} — {{ currentClass.endTime }}
          <span class="mx-2 text-medium-emphasis">·</span>
          {{ currentClass.classCode }}
        </div>

        <!-- Check-in progress -->
        <div class="mb-1 d-flex align-center justify-space-between">
          <span class="progress-label">
            <span class="progress-count text-success">{{
              currentClass.checkedInCount
            }}</span>
            <span class="progress-total">
              / {{ currentClass.studentCount }} checked in</span
            >
          </span>
          <span class="progress-pct text-success">{{ progressPercent }}%</span>
        </div>
        <v-progress-linear
          :model-value="progressPercent"
          color="success"
          bg-color="success"
          bg-opacity="0.15"
          rounded
          height="6"
          class="mb-4"
        />

        <v-btn
          color="success"
          variant="tonal"
          size="small"
          append-icon="mdi-arrow-right"
          @click="navigateToClass(currentClass.id)"
        >
          View Attendance
        </v-btn>
      </v-card-text>
    </template>

    <!-- NEXT state -->
    <template v-else-if="cardState === 'next' && nextClass">
      <div class="card-accent card-accent--next" />
      <v-card-text class="pa-5 pa-sm-6">
        <div class="d-flex align-start justify-space-between mb-1">
          <div class="d-flex align-center ga-3">
            <span class="next-badge">NEXT</span>
            <span class="class-subject">{{ nextClass.className }}</span>
          </div>
          <v-icon size="28" :color="nextClass.color">{{ nextClass.icon }}</v-icon>
        </div>

        <div class="class-meta mb-3">
          <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
          {{ nextClass.room }}
          <span class="mx-2 text-medium-emphasis">·</span>
          <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
          starts at {{ nextClass.startTime }}
          <span class="mx-2 text-medium-emphasis">·</span>
          {{ nextClass.classCode }}
        </div>

        <div class="no-class-note mb-4">
          <v-icon size="14" class="mr-1">mdi-timer-sand</v-icon>
          Starts in {{ minutesUntilNext }} min · {{ nextClass.studentCount }} students
          enrolled
        </div>

        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          append-icon="mdi-arrow-right"
          @click="navigateToClass(nextClass.id)"
        >
          View Class
        </v-btn>
      </v-card-text>
    </template>

    <!-- DONE state -->
    <template v-else-if="cardState === 'done'">
      <div class="card-accent card-accent--done" />
      <v-card-text class="pa-5 pa-sm-6 d-flex align-center ga-4">
        <v-avatar size="48" rounded="lg" color="success" variant="tonal">
          <v-icon size="26">mdi-check-circle-outline</v-icon>
        </v-avatar>
        <div>
          <div class="done-title">All done for today</div>
          <div class="done-meta">
            {{ completedCount }} session{{ completedCount !== 1 ? 's' : '' }} completed
            <span class="mx-2 text-medium-emphasis">·</span>
            {{ todayCheckedInTotal }}/{{ todayStudentTotal }} attended
          </div>
        </div>
      </v-card-text>
    </template>

    <!-- EMPTY state (no classes today) -->
    <template v-else>
      <div class="card-accent card-accent--empty" />
      <v-card-text class="pa-5 pa-sm-6 d-flex align-center ga-4">
        <v-avatar size="48" rounded="lg" color="secondary" variant="tonal">
          <v-icon size="26">mdi-calendar-blank-outline</v-icon>
        </v-avatar>
        <div>
          <div class="done-title">No classes today</div>
          <div class="done-meta text-medium-emphasis">Enjoy your free day</div>
        </div>
      </v-card-text>
    </template>
  </v-card>
</template>

<style scoped>
  .current-class-card {
    position: relative;
    overflow: hidden;
  }

  .card-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  .card-accent--live {
    background: var(--color-success);
    box-shadow: 0 0 12px var(--color-success-soft);
  }

  .card-accent--next {
    background: var(--color-primary);
  }

  .card-accent--done {
    background: var(--color-success-soft);
  }

  .card-accent--empty {
    background: var(--color-border);
  }

  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(77, 184, 124, 0.12);
    color: var(--color-success);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid rgba(77, 184, 124, 0.25);
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-success);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .next-badge {
    display: inline-flex;
    align-items: center;
    background: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid rgba(var(--v-theme-primary), 0.2);
  }

  .class-subject {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .class-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .class-meta {
    font-size: 0.78rem;
    color: var(--color-ink-muted);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .no-class-note {
    font-size: 0.78rem;
    color: var(--color-ink-muted);
    display: flex;
    align-items: center;
  }

  .progress-label {
    font-size: 0.82rem;
  }

  .progress-count {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .progress-total {
    color: var(--color-ink-muted);
    font-size: 0.82rem;
  }

  .progress-pct {
    font-size: 0.78rem;
    font-weight: 600;
  }

  .done-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .done-meta {
    font-size: 0.82rem;
    color: var(--color-ink-muted);
    display: flex;
    align-items: center;
  }
</style>
