<script setup lang="ts">
  const props = defineProps<{
    totalStudent: number
    totalOnTime: number
    totalLate: number
    totalAbsent: number
  }>()
</script>

<template>
  <v-row class="mb-6" dense>
    <v-col cols="6" md="3">
      <v-card class="stat-card stat-card--total animate-in animate-delay-1">
        <v-card-text class="d-flex align-center pa-4">
          <v-avatar size="44" rounded="lg" color="primary" variant="tonal" class="mr-4">
            <v-icon size="22">mdi-account-group</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="text-caption text-medium-emphasis stat-label"> Total </span>
            <span class="stat-value">
              {{ props.totalStudent }}
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="6" md="3">
      <v-card class="stat-card stat-card--success animate-in animate-delay-2">
        <v-card-text class="d-flex align-center pa-4">
          <v-avatar size="44" rounded="lg" color="success" variant="tonal" class="mr-4">
            <v-icon size="22">mdi-check-circle-outline</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="text-caption text-medium-emphasis stat-label"> On Time </span>
            <span class="stat-value text-success">
              {{ props.totalOnTime }}
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="6" md="3">
      <v-card class="stat-card stat-card--warning animate-in animate-delay-3">
        <v-card-text class="d-flex align-center pa-4">
          <v-avatar size="44" rounded="lg" color="warning" variant="tonal" class="mr-4">
            <v-icon size="22">mdi-clock-alert-outline</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="text-caption text-medium-emphasis stat-label"> Late </span>
            <span class="stat-value text-warning">
              {{ props.totalLate }}
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="6" md="3">
      <v-card class="stat-card stat-card--error animate-in animate-delay-4">
        <v-card-text class="d-flex align-center pa-4">
          <v-avatar size="44" rounded="lg" color="error" variant="tonal" class="mr-4">
            <v-icon size="22">mdi-account-off-outline</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="text-caption text-medium-emphasis stat-label"> Absent </span>
            <span class="stat-value text-error">
              {{ props.totalAbsent }}
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
  .stat-label {
    font-family: var(--font-body);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.75rem;
    line-height: 1.1;
  }
</style>
