<script setup lang="ts">
import type { IStudentAttendance } from '@/types/attendance'
import { getAttendanceStatusColor } from '@/utils/attendance'

const props = defineProps<{
  listStudentAttendance: IStudentAttendance[]
}>()
</script>

<template>
  <v-card elevation="1">
    <v-card-title class="d-flex align-center flex-wrap">
      <span class="text-subtitle-1 font-weight-medium">
        Real-time Attendance List
      </span>
      <v-spacer />
      <v-chip
        color="primary"
        variant="flat"
        size="small"
        class="text-caption mt-2 mt-sm-0"
      >
        Real-time
      </v-chip>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-0">
      <v-table density="comfortable">
        <thead>
          <tr>
            <th class="text-left text-caption text-medium-emphasis">
              Student ID
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Full Name
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Check-in
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Seat
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="attendanceItem in props.listStudentAttendance"
            :key="attendanceItem.id"
          >
            <td class="text-body-2">
              {{ attendanceItem.studentCode }}
            </td>
            <td class="text-body-2">
              {{ attendanceItem.fullName }}
            </td>
            <td class="text-body-2">
              {{
                attendanceItem.checkInTime !== null
                  ? attendanceItem.checkInTime
                  : '--'
              }}
            </td>
            <td class="text-body-2">
              {{
                attendanceItem.seatCode !== null ? attendanceItem.seatCode : '--'
              }}
            </td>
            <td class="text-body-2">
              <v-chip
                :color="getAttendanceStatusColor({ status: attendanceItem.status })"
                size="small"
                variant="flat"
              >
                <span v-if="attendanceItem.status === 'ON_TIME'">
                  On Time
                </span>
                <span v-else-if="attendanceItem.status === 'LATE'">
                  Late
                </span>
                <span v-else>
                  Absent
                </span>
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

