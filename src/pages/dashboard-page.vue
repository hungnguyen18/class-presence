<script setup lang="ts">
  import AppLayout from '../components/layout/app-layout.vue'
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="page-title">
            Good morning, Teacher
          </h1>
          <p class="page-subtitle">
            Here's your attendance overview for today.
          </p>
        </v-col>
      </v-row>

      <v-row class="mb-6" dense>
        <v-col cols="6" md="3">
          <v-card class="stat-card stat-card--total animate-in animate-delay-1">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="primary" variant="tonal" class="mr-4">
                <v-icon size="22">mdi-book-open-variant</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis dash-label">Classes</span>
                <span class="dash-value">3</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card class="stat-card stat-card--success animate-in animate-delay-2">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="success" variant="tonal" class="mr-4">
                <v-icon size="22">mdi-calendar-check</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis dash-label">Sessions Today</span>
                <span class="dash-value text-success">5</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card class="stat-card stat-card--warning animate-in animate-delay-3">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="info" variant="tonal" class="mr-4">
                <v-icon size="22">mdi-account-group</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis dash-label">Students</span>
                <span class="dash-value">135</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card class="stat-card stat-card--total animate-in animate-delay-4">
            <v-card-text class="d-flex align-center pa-4">
              <v-avatar size="44" rounded="lg" color="secondary" variant="tonal" class="mr-4">
                <v-icon size="22">mdi-chip</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis dash-label">Devices</span>
                <span class="dash-value">3</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="7">
          <v-card class="animate-in animate-delay-3">
            <v-card-title class="card-heading pa-5 pb-3">
              System Status
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <v-list lines="two" class="pa-0">
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="success" variant="tonal" size="36" rounded="lg">
                      <v-icon size="18">mdi-access-point</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    All devices online
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    3 IoT devices connected and reporting
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="info" variant="tonal" size="36" rounded="lg">
                      <v-icon size="18">mdi-clock-check-outline</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    Next session in 45 minutes
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    IoT Class — Group 10 at Room 202
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="warning" variant="tonal" size="36" rounded="lg">
                      <v-icon size="18">mdi-alert-circle-outline</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    1 class below attendance threshold
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Blockchain Class — Group 03 at 72%
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card class="animate-in animate-delay-4">
            <v-card-title class="card-heading pa-5 pb-3">
              Recent Activity
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <v-timeline density="compact" side="end" class="activity-timeline">
                <v-timeline-item
                  dot-color="success"
                  size="x-small"
                >
                  <div class="text-body-2">Session completed — AI Class</div>
                  <div class="text-caption text-medium-emphasis">10 minutes ago</div>
                </v-timeline-item>

                <v-timeline-item
                  dot-color="info"
                  size="x-small"
                >
                  <div class="text-body-2">Report exported — IoT Class</div>
                  <div class="text-caption text-medium-emphasis">1 hour ago</div>
                </v-timeline-item>

                <v-timeline-item
                  dot-color="warning"
                  size="x-small"
                >
                  <div class="text-body-2">Late check-in — Chris Taylor</div>
                  <div class="text-caption text-medium-emphasis">2 hours ago</div>
                </v-timeline-item>
              </v-timeline>
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

.activity-timeline {
  padding-top: 0;
}

.activity-timeline :deep(.v-timeline-item__body) {
  padding-top: 0 !important;
}
</style>
