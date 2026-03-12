<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { IStudentAttendance } from '../types/attendance'
  import { calculateAttendanceRate, calculateAttendanceStats } from '../utils/attendance'
  import AppLayout from '../components/layout/app-layout.vue'
  import AttendanceSummaryCards from '../components/dashboard/attendance-summary-cards.vue'
  import AttendanceTable from '../components/dashboard/attendance-table.vue'
  import AttendanceRateCard from '../components/dashboard/attendance-rate-card.vue'
  import SeatMapCard from '../components/dashboard/seat-map-card.vue'

  const listStudentAttendance = ref<IStudentAttendance[]>([
    {
      id: '1',
      studentCode: '22810001',
      fullName: 'Alex Johnson',
      status: 'ON_TIME',
      checkInTime: '07:58',
      seatCode: 'A1',
    },
    {
      id: '2',
      studentCode: '22810002',
      fullName: 'Emma Wilson',
      status: 'ON_TIME',
      checkInTime: '08:00',
      seatCode: 'A2',
    },
    {
      id: '3',
      studentCode: '22810003',
      fullName: 'Chris Taylor',
      status: 'LATE',
      checkInTime: '08:12',
      seatCode: 'B3',
    },
    {
      id: '4',
      studentCode: '22810004',
      fullName: 'Diana Brown',
      status: 'ABSENT',
      checkInTime: null,
      seatCode: null,
    },
    {
      id: '5',
      studentCode: '22810005',
      fullName: 'Eric Davis',
      status: 'ON_TIME',
      checkInTime: '07:55',
      seatCode: 'C4',
    },
    {
      id: '6',
      studentCode: '22810006',
      fullName: 'Fiona Martinez',
      status: 'ON_TIME',
      checkInTime: '07:59',
      seatCode: 'C5',
    },
  ])

  const attendanceStats = computed(() =>
    calculateAttendanceStats({ listStudentAttendance: listStudentAttendance.value }),
  )

  const attendanceRate = computed(() =>
    calculateAttendanceRate({ stats: attendanceStats.value }),
  )
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
            IoT — Student Attendance
          </h1>
          <p class="page-subtitle">
            Track class attendance in real-time.
          </p>
        </v-col>
        <v-col cols="12" md="5" class="d-flex flex-wrap justify-md-end align-center ga-3">
          <v-select
            label="Session"
            density="comfortable"
            hide-details
            style="max-width: 240px"
            :items="['Session 01 — 08:00', 'Session 02 — 10:00', 'Session 03 — 14:00']"
            model-value="Session 01 — 08:00"
          />
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            variant="flat"
            class="text-none font-weight-medium"
          >
            Export
          </v-btn>
        </v-col>
      </v-row>

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
    </v-container>
  </AppLayout>
</template>
