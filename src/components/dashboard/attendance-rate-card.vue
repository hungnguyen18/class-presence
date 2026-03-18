<script setup lang="ts">
  import { computed } from 'vue'
  import { ATTENDANCE_RATE_GOOD, ATTENDANCE_RATE_WARNING } from '@/constants/attendance'

  const props = defineProps<{
    attendanceRate: number
  }>()

  const rateColor = computed(() => {
    if (props.attendanceRate >= ATTENDANCE_RATE_GOOD) {
      return 'success'
    }
    if (props.attendanceRate >= ATTENDANCE_RATE_WARNING) {
      return 'warning'
    }
    return 'error'
  })

  const rateStatus = computed(() => {
    if (props.attendanceRate >= ATTENDANCE_RATE_GOOD) {
      return 'Good standing'
    }
    if (props.attendanceRate >= ATTENDANCE_RATE_WARNING) {
      return 'Needs attention'
    }
    return 'At risk'
  })
</script>

<template>
  <v-card class="animate-in animate-delay-4">
    <v-card-title class="rate-title pa-5 pb-3"> Attendance Rate </v-card-title>
    <v-divider />
    <v-card-text class="pa-5">
      <div class="d-flex align-center mb-4">
        <div class="rate-number mr-3">{{ props.attendanceRate }}%</div>
        <v-chip
          :color="rateColor"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          {{ rateStatus }}
        </v-chip>
      </div>

      <v-progress-linear
        :model-value="props.attendanceRate"
        height="8"
        :color="rateColor"
        rounded
        bg-color="surface-variant"
        class="mb-3"
      />

      <div class="d-flex justify-space-between text-caption text-medium-emphasis">
        <span>Late arrivals adjusted</span>
        <span>Target: {{ ATTENDANCE_RATE_GOOD }}%</span>
      </div>

      <v-alert
        v-if="props.attendanceRate < ATTENDANCE_RATE_GOOD"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
        icon="mdi-alert-circle-outline"
      >
        <span class="text-caption">
          Below {{ ATTENDANCE_RATE_GOOD }}% threshold for exam eligibility.
        </span>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<style scoped>
  .rate-title {
    font-family: var(--font-display) !important;
    font-size: 1.05rem !important;
  }

  .rate-number {
    font-family: var(--font-display);
    font-size: 2.2rem;
    line-height: 1;
    color: var(--color-ink);
  }
</style>
