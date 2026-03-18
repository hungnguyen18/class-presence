<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import type { ITodaySession } from '@/composables/use-today-schedule'

  defineProps<{
    listTodaySession: ITodaySession[]
    isLoading: boolean
  }>()

  const router = useRouter()

  function navigateToClass(classId: string) {
    router.push({ name: 'classDashboard', params: { classId } })
  }
</script>

<template>
  <div>
    <div class="bar-header d-flex align-center mb-3">
      <span class="bar-label">Today's Schedule</span>
      <span v-if="!isLoading && listTodaySession.length > 0" class="bar-count ml-2">
        {{ listTodaySession.length }} class{{ listTodaySession.length !== 1 ? 'es' : '' }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="d-flex ga-3">
      <v-skeleton-loader v-for="i in 3" :key="i" type="chip" width="180" />
    </div>

    <!-- Empty -->
    <div v-else-if="listTodaySession.length === 0" class="no-schedule-note">
      No classes scheduled for today
    </div>

    <!-- Session chips -->
    <div v-else class="schedule-scroll d-flex ga-3 flex-wrap">
      <v-card
        v-for="session in listTodaySession"
        :key="session.id"
        class="session-chip"
        :class="{
          'session-chip--live': session.isLive,
          'session-chip--past': session.isPast,
        }"
        flat
        @click="navigateToClass(session.id)"
      >
        <div class="d-flex align-center ga-3 pa-3 px-4">
          <v-avatar size="32" rounded="lg" :color="session.color" variant="tonal">
            <v-icon size="16">{{ session.icon }}</v-icon>
          </v-avatar>
          <div class="chip-content">
            <div class="chip-name">{{ session.className }}</div>
            <div class="chip-meta">
              {{ session.room }} · {{ session.startTime }}–{{ session.endTime }}
            </div>
          </div>
          <div class="chip-status">
            <template v-if="session.isLive">
              <span class="live-dot" />
              <span class="text-success chip-status-text"
                >{{ session.checkedInCount }}/{{ session.studentCount }}</span
              >
            </template>
            <template v-else-if="session.isPast">
              <v-icon size="14" color="success" class="mr-1">mdi-check</v-icon>
              <span class="chip-status-text text-medium-emphasis"
                >{{ session.checkedInCount }}/{{ session.studentCount }}</span
              >
            </template>
            <template v-else>
              <span class="chip-status-text text-medium-emphasis"
                >{{ session.studentCount }} enrolled</span
              >
            </template>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
  .bar-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-muted);
  }

  .bar-count {
    font-size: 0.68rem;
    color: var(--color-ink-muted);
    opacity: 0.7;
  }

  .no-schedule-note {
    font-size: 0.82rem;
    color: var(--color-ink-muted);
  }

  .session-chip {
    cursor: pointer;
    border: 1.5px solid var(--color-border) !important;
    border-radius: 12px !important;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
    min-width: 0;
    flex: 1 1 260px;
    max-width: 360px;
  }

  .session-chip:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
  }

  .session-chip--live {
    border-color: var(--color-success) !important;
    background: rgba(77, 184, 124, 0.04) !important;
  }

  .session-chip--past {
    opacity: 0.55;
  }

  .chip-content {
    flex: 1;
    min-width: 0;
  }

  .chip-name {
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-meta {
    font-size: 0.68rem;
    color: var(--color-ink-muted);
    white-space: nowrap;
  }

  .chip-status {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .chip-status-text {
    font-size: 0.72rem;
    font-weight: 600;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-success);
    animation: pulse 1.5s infinite;
    flex-shrink: 0;
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
</style>
