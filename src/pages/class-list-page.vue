<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import AppLayout from '../components/layout/app-layout.vue'
  import { useClasses } from '@/composables/use-classes'
  import { getClassTheme } from '@/constants/class'

  const { listClass, isLoading, fetchClasses } = useClasses()
  const router = useRouter()

  function goToClassDashboard({ classId }: { classId: string }) {
    router.push({ name: 'classDashboard', params: { classId } })
  }

  onMounted(() => {
    fetchClasses()
  })
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-6" align="center">
        <v-col cols="12" md="6">
          <h1 class="page-title">Classes</h1>
          <p class="page-subtitle">Select a class to view attendance details.</p>
        </v-col>
      </v-row>

      <v-row v-if="isLoading">
        <v-col v-for="n in 3" :key="n" cols="12" sm="6" md="4">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <v-row v-else-if="listClass.length === 0">
        <v-col cols="12" class="text-center py-16">
          <v-icon size="64" color="medium-emphasis">mdi-book-open-variant</v-icon>
          <p class="mt-4 text-medium-emphasis">No classes found.</p>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          v-for="(classItem, index) in listClass"
          :key="classItem.id"
          cols="12"
          sm="6"
          md="4"
          class="d-flex"
        >
          <v-card
            class="flex-grow-1 card-interactive animate-in"
            :class="`animate-delay-${index + 1}`"
            @click="goToClassDashboard({ classId: classItem.id })"
          >
            <v-card-text class="pa-5">
              <div class="d-flex align-center mb-4">
                <v-avatar
                  :color="getClassTheme(classItem.subjectName).color"
                  variant="tonal"
                  size="48"
                  rounded="lg"
                >
                  <v-icon size="24">{{
                    getClassTheme(classItem.subjectName).icon
                  }}</v-icon>
                </v-avatar>
                <div class="ml-4">
                  <div class="class-code">{{ classItem.classCode }}</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ classItem.subjectName }}
                  </div>
                </div>
              </div>

              <v-divider class="mb-4" />

              <div class="d-flex justify-space-between">
                <div class="class-meta">
                  <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
                  {{ classItem.room?.name ?? '' }}
                </div>
                <div class="class-meta">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ classItem.startTime.slice(0, 5) }} —
                  {{ classItem.endTime.slice(0, 5) }}
                </div>
              </div>
            </v-card-text>

            <v-card-actions class="px-5 pb-4 pt-0">
              <v-spacer />
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                class="text-none font-weight-medium"
                append-icon="mdi-arrow-right"
              >
                View Details
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

<style scoped>
  .class-code {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink-muted);
    font-family: var(--font-body);
    font-weight: 600;
    margin-bottom: 2px;
  }

  .class-meta {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    color: var(--color-ink-muted);
    font-family: var(--font-body);
  }

  .card-interactive {
    cursor: pointer;
  }
</style>
