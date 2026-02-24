<script setup lang="ts">
  import AppLayout from '../components/layout/app-layout.vue'
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-4 pa-sm-6">
      <v-row class="mb-4">
        <v-col cols="12">
          <h1 class="text-h5 text-sm-h4 font-weight-medium mb-1">
            Attendance System Dashboard
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            General overview. Content will be updated once display requirements are confirmed.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg" class="mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-medium">
              System Status
            </v-card-title>
            <v-card-text class="text-body-2 text-medium-emphasis">
              This area will display system metrics (class count, sessions, real-time activity
              status, etc.).
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="lg" class="mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-medium">
              Recent Activity
            </v-card-title>
            <v-card-text class="text-body-2 text-medium-emphasis">
              Placeholder for recent activity logs, quick reports, or system alerts.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

