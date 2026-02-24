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
      fullName: 'Nguyễn Văn A',
      status: 'ON_TIME',
      checkInTime: '07:58',
      seatCode: 'A1',
    },
    {
      id: '2',
      studentCode: '22810002',
      fullName: 'Trần Thị B',
      status: 'ON_TIME',
      checkInTime: '08:00',
      seatCode: 'A2',
    },
    {
      id: '3',
      studentCode: '22810003',
      fullName: 'Lê Văn C',
      status: 'LATE',
      checkInTime: '08:12',
      seatCode: 'B3',
    },
    {
      id: '4',
      studentCode: '22810004',
      fullName: 'Phạm Thị D',
      status: 'ABSENT',
      checkInTime: null,
      seatCode: null,
    },
    {
      id: '5',
      studentCode: '22810005',
      fullName: 'Đỗ Văn E',
      status: 'ON_TIME',
      checkInTime: '07:55',
      seatCode: 'C4',
    },
    {
      id: '6',
      studentCode: '22810006',
      fullName: 'Hoàng Thị F',
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
    <v-container fluid class="pa-4 pa-sm-6">
      <v-row class="mb-4" align="center" justify="space-between">
        <v-col cols="12" md="6">
          <h1 class="text-h5 text-sm-h4 font-weight-medium mb-1">
            Lớp: IoT - Hệ thống điểm danh học sinh
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            Theo dõi tình trạng tham gia lớp học theo thời gian thực.
          </p>
        </v-col>
        <v-col cols="12" md="6" class="d-flex flex-wrap justify-end align-center">
          <v-select
            label="Buổi học"
            class="mr-md-3 mb-3 mb-md-0"
            density="comfortable"
            variant="outlined"
            hide-details
            style="max-width: 260px"
            :items="['Buổi 01 - 08:00', 'Buổi 02 - 08:00', 'Buổi 03 - 08:00']"
            model-value="Buổi 01 - 08:00"
          />
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            variant="flat"
            class="text-none"
          >
            Xuất báo cáo Excel
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
          <AttendanceRateCard :attendance-rate="attendanceRate" />
          <SeatMapCard class="mt-4" :list-student-attendance="listStudentAttendance" />
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

