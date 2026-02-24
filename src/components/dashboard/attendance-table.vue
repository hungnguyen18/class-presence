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
        Danh sách điểm danh theo thời gian thực
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
              MSSV
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Họ và tên
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Giờ đến
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Ghế
            </th>
            <th class="text-left text-caption text-medium-emphasis">
              Trạng thái
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
                  Đúng giờ
                </span>
                <span v-else-if="attendanceItem.status === 'LATE'">
                  Đi trễ
                </span>
                <span v-else>
                  Vắng mặt
                </span>
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

