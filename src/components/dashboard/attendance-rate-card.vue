<script setup lang="ts">
  const props = defineProps<{
    attendanceRate: number
  }>()
</script>

<template>
  <v-card elevation="1" class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-medium">
      Tỷ lệ tham dự buổi học
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div class="d-flex flex-column align-start mb-2">
        <span class="text-h5 font-weight-medium mr-2"> {{ props.attendanceRate }}% </span>
        <span class="text-body-2 text-medium-emphasis"> (đã quy đổi đi trễ) </span>
      </div>
      <v-progress-linear
        :model-value="props.attendanceRate"
        height="10"
        color="primary"
        rounded
        striped
      />
      <p class="text-caption text-medium-emphasis mt-2 mb-0">
        Cảnh báo: Tỷ lệ tham dự cần ≥ 80% để đủ điều kiện dự thi.
      </p>
    </v-card-text>
  </v-card>
</template>
