<script setup lang="ts">
import type { IStudentAttendance } from '@/types/attendance'

const props = defineProps<{
  listStudentAttendance: IStudentAttendance[]
}>()

function getSeatStatus({
  seatCode,
}: {
  seatCode: string
}): 'ON_TIME' | 'LATE' | 'EMPTY' {
  const studentAtSeat = props.listStudentAttendance.find(
    (attendanceItem) => attendanceItem.seatCode === seatCode,
  )

  if (!studentAtSeat) {
    return 'EMPTY'
  }

  if (studentAtSeat.status === 'LATE') {
    return 'LATE'
  }

  return 'ON_TIME'
}
</script>

<template>
  <v-card elevation="1">
    <v-card-title class="text-subtitle-1 font-weight-medium">
      Seat Map (Mock)
    </v-card-title>
    <v-divider />
    <v-card-text>
      <p class="text-caption text-medium-emphasis mb-3">
        Green: checked in on time. Yellow: late. White: empty.
      </p>
      <div class="seat-grid">
        <div
          v-for="rowCode in ['A', 'B', 'C']"
          :key="rowCode"
          class="seat-row"
        >
          <span class="seat-row-label">
            {{ rowCode }}
          </span>
          <div class="seat-row-list">
            <button
              v-for="seatIndex in 5"
              :key="`${rowCode}${seatIndex}`"
              class="seat-item"
              type="button"
            >
              <span
                class="seat-indicator"
                :class="{
                  'seat-indicator--on-time':
                    getSeatStatus({ seatCode: `${rowCode}${seatIndex}` }) ===
                    'ON_TIME',
                  'seat-indicator--late':
                    getSeatStatus({ seatCode: `${rowCode}${seatIndex}` }) ===
                    'LATE',
                }"
              />
              <span class="seat-label">
                {{ rowCode }}{{ seatIndex }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seat-row-label {
  width: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.54);
}

.seat-row-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.seat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.seat-item:focus-visible .seat-indicator {
  outline: 2px solid rgb(25, 118, 210);
  outline-offset: 2px;
}

.seat-indicator {
  width: 100%;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: white;
}

.seat-indicator--on-time {
  background-color: rgb(56, 142, 60);
  border-color: rgb(46, 125, 50);
}

.seat-indicator--late {
  background-color: rgb(251, 192, 45);
  border-color: rgb(245, 171, 0);
}

.seat-label {
  margin-top: 2px;
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.6);
}
</style>

