<script setup lang="ts">
  const props = defineProps<{
    attendanceRate: number
  }>()
</script>

<template>
  <v-card elevation="1" class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-medium">
      Session Attendance Rate
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div class="d-flex flex-column align-start mb-2">
        <span class="text-h5 font-weight-medium mr-2"> {{ props.attendanceRate }}% </span>
        <span class="text-body-2 text-medium-emphasis"> (late arrivals adjusted) </span>
      </div>
      <v-progress-linear
        :model-value="props.attendanceRate"
        height="10"
        color="primary"
        rounded
        striped
      />
      <p class="text-caption text-medium-emphasis mt-2 mb-0">
        Warning: Attendance rate must be ≥ 80% to qualify for exams.
      </p>
    </v-card-text>
  </v-card>
</template>
