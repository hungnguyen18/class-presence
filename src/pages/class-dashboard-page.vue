<script setup lang="ts">
  import { onMounted, onUnmounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppLayout from '../components/layout/app-layout.vue'
  import AttendanceSummaryCards from '../components/dashboard/attendance-summary-cards.vue'
  import AttendanceTable from '../components/dashboard/attendance-table.vue'
  import AttendanceRateCard from '../components/dashboard/attendance-rate-card.vue'
  import SeatMapCard from '../components/dashboard/seat-map-card.vue'
  import { useAttendance } from '@/composables/use-attendance'
  import { useClasses } from '@/composables/use-classes'
  import { subscribeAttendance } from '@/composables/use-realtime'

  const route = useRoute()
  const classId = computed(() => route.params.classId as string)

  const {
    listStudentAttendance,
    attendanceStats,
    attendanceRate,
    isLoading,
    fetchAttendance,
  } = useAttendance()

  const { listClass, fetchClasses } = useClasses()

  const currentClass = computed(() => listClass.value.find((c) => c.id === classId.value))

  const pageTitle = computed(() => {
    if (currentClass.value) {
      return `${currentClass.value.subjectName} — Student Attendance`
    }
    return 'Student Attendance'
  })

  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    await Promise.all([fetchAttendance(classId.value), fetchClasses()])

    unsubscribe = subscribeAttendance(() => {
      fetchAttendance(classId.value)
    }, classId.value).unsubscribe
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-2" align="center">
        <v-col cols="12" md="7">
          <div class="d-flex align-center mb-2">
            <v-btn
              variant="text"
              color="primary"
              size="small"
              class="text-none mr-2 px-0"
              to="/classes"
              prepend-icon="mdi-arrow-left"
            >
              Classes
            </v-btn>
          </div>
          <h1 class="page-title">
            {{ pageTitle }}
          </h1>
          <p class="page-subtitle">Track class attendance in real-time.</p>
        </v-col>
        <v-col cols="12" md="5" />
      </v-row>

      <v-row v-if="isLoading" class="mb-4">
        <v-col v-for="n in 4" :key="n" cols="6" md="3">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <template v-else>
        <AttendanceSummaryCards
          :total-student="attendanceStats.totalStudent"
          :total-on-time="attendanceStats.totalOnTime"
          :total-late="attendanceStats.totalLate"
          :total-absent="attendanceStats.totalAbsent"
        />

        <v-row>
          <v-col cols="12" lg="8">
            <AttendanceTable :list-student-attendance="listStudentAttendance" />
          </v-col>

          <v-col cols="12" lg="4">
            <AttendanceRateCard :attendance-rate="attendanceRate" class="mb-4" />
            <SeatMapCard :list-student-attendance="listStudentAttendance" />
          </v-col>
        </v-row>
      </template>
    </v-container>
  </AppLayout>
</template>
