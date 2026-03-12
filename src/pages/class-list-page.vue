<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AppLayout from '../components/layout/app-layout.vue'

  interface IClassItem {
    id: string
    name: string
    code: string
    studentCount: number
    room: string
    icon: string
    color: string
  }

  const listClass = ref<IClassItem[]>([
    {
      id: 'class-iot-10',
      name: 'IoT Class — Group 10',
      code: 'IOT101-10',
      studentCount: 45,
      room: 'Room 202',
      icon: 'mdi-access-point',
      color: 'info',
    },
    {
      id: 'class-ai-01',
      name: 'AI Class — Group 01',
      code: 'AI201-01',
      studentCount: 50,
      room: 'Room 305',
      icon: 'mdi-robot-outline',
      color: 'secondary',
    },
    {
      id: 'class-blockchain-03',
      name: 'Blockchain Class — Group 03',
      code: 'BC301-03',
      studentCount: 40,
      room: 'Room 407',
      icon: 'mdi-link-variant',
      color: 'primary',
    },
  ])

  const router = useRouter()

  function goToClassDashboard({ classId }: { classId: string }) {
    router.push({ name: 'classDashboard', params: { classId } })
  }
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-6" align="center">
        <v-col cols="12" md="6">
          <h1 class="page-title">Classes</h1>
          <p class="page-subtitle">
            Select a class to view attendance details.
          </p>
        </v-col>
      </v-row>

      <v-row>
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
                  :color="classItem.color"
                  variant="tonal"
                  size="48"
                  rounded="lg"
                >
                  <v-icon size="24">{{ classItem.icon }}</v-icon>
                </v-avatar>
                <div class="ml-4">
                  <div class="class-code">{{ classItem.code }}</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ classItem.name }}
                  </div>
                </div>
              </div>

              <v-divider class="mb-4" />

              <div class="d-flex justify-space-between">
                <div class="class-meta">
                  <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
                  {{ classItem.room }}
                </div>
                <div class="class-meta">
                  <v-icon size="14" class="mr-1">mdi-account-group-outline</v-icon>
                  {{ classItem.studentCount }} students
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
