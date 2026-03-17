<script setup lang="ts">
import type { IStudentAttendance } from '@/types/attendance'
import { getAttendanceStatusColor } from '@/utils/attendance'
import { ATTENDANCE_STATUS_LABEL_MAP } from '@/constants/attendance'

const props = defineProps<{
  listStudentAttendance: IStudentAttendance[]
}>()

function formatStatusLabel({ status }: { status: string }): string {
  return ATTENDANCE_STATUS_LABEL_MAP[status] ?? 'Absent'
}
</script>

<template>
  <v-card class="animate-in animate-delay-3">
    <v-card-title class="d-flex align-center flex-wrap pa-5 pb-4">
      <div>
        <span class="table-title">Attendance List</span>
        <span class="d-block text-caption text-medium-emphasis mt-1">
          Real-time check-in status
        </span>
      </div>
      <v-spacer />
      <v-chip
        color="success"
        variant="tonal"
        size="small"
        prepend-icon="mdi-access-point"
      >
        Live
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <v-table density="comfortable" hover>
        <thead>
          <tr>
            <th class="th-cell">Student ID</th>
            <th class="th-cell">Full Name</th>
            <th class="th-cell">Check-in</th>
            <th class="th-cell">Seat</th>
            <th class="th-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="attendanceItem in props.listStudentAttendance"
            :key="attendanceItem.id"
          >
            <td class="text-body-2 font-weight-medium">
              {{ attendanceItem.studentCode }}
            </td>
            <td class="text-body-2">
              {{ attendanceItem.fullName }}
            </td>
            <td class="text-body-2">
              <span v-if="attendanceItem.checkInTime !== null" class="d-flex align-center">
                <v-icon size="14" color="medium-emphasis" class="mr-1">mdi-clock-outline</v-icon>
                {{ attendanceItem.checkInTime }}
              </span>
              <span v-else class="text-disabled">—</span>
            </td>
            <td class="text-body-2">
              <span v-if="attendanceItem.seatCode !== null">
                {{ attendanceItem.seatCode }}
              </span>
              <span v-else class="text-disabled">—</span>
            </td>
            <td class="text-body-2">
              <v-chip
                :color="getAttendanceStatusColor({ status: attendanceItem.status })"
                size="small"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ formatStatusLabel({ status: attendanceItem.status }) }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.table-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--color-ink);
}

.th-cell {
  text-align: left;
  font-family: var(--font-body) !important;
  font-size: 0.72rem !important;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-ink-muted) !important;
  font-weight: 600 !important;
  border-bottom-color: var(--color-border) !important;
}
</style>
