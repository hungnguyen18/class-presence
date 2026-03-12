<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    attendanceRate: number
  }>()

  const rateColor = computed(() => {
    if (props.attendanceRate >= 80) {
      return 'success'
    }
    if (props.attendanceRate >= 60) {
      return 'warning'
    }
    return 'error'
  })

  const rateStatus = computed(() => {
    if (props.attendanceRate >= 80) {
      return 'Good standing'
    }
    if (props.attendanceRate >= 60) {
      return 'Needs attention'
    }
    return 'At risk'
  })
</script>

<template>
  <v-card class="animate-in animate-delay-4">
    <v-card-title class="rate-title pa-5 pb-3">
      Attendance Rate
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-5">
      <div class="d-flex align-center mb-4">
        <div class="rate-number mr-3">
          {{ props.attendanceRate }}%
        </div>
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
        <span>Target: 80%</span>
      </div>

      <v-alert
        v-if="props.attendanceRate < 80"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
        icon="mdi-alert-circle-outline"
      >
        <span class="text-caption">
          Below 80% threshold for exam eligibility.
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
