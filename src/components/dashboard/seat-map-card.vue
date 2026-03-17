<script setup lang="ts">
import type { IStudentAttendance } from '@/types/attendance'
import { EAttendanceStatus } from '@/types/attendance'
import { SEAT_ROWS, SEAT_COLUMNS } from '@/constants/ui'

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

  if (studentAtSeat.status === EAttendanceStatus.LATE) {
    return EAttendanceStatus.LATE
  }

  return EAttendanceStatus.ON_TIME
}

function getStudentAtSeat({ seatCode }: { seatCode: string }): string | null {
  const studentAtSeat = props.listStudentAttendance.find(
    (attendanceItem) => attendanceItem.seatCode === seatCode,
  )

  if (!studentAtSeat) {
    return null
  }

  return studentAtSeat.fullName
}
</script>

<template>
  <v-card class="animate-in animate-delay-5">
    <v-card-title class="seat-map-title pa-5 pb-3">
      Seat Map
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-5">
      <div class="seat-legend mb-4">
        <span class="seat-legend-item">
          <span class="seat-legend-dot seat-legend-dot--on-time" />
          On Time
        </span>
        <span class="seat-legend-item">
          <span class="seat-legend-dot seat-legend-dot--late" />
          Late
        </span>
        <span class="seat-legend-item">
          <span class="seat-legend-dot seat-legend-dot--empty" />
          Empty
        </span>
      </div>

      <div class="seat-grid">
        <div class="seat-board-label">
          <v-icon size="14" class="mr-1">mdi-presentation</v-icon>
          Board
        </div>

        <div
          v-for="rowCode in SEAT_ROWS"
          :key="rowCode"
          class="seat-row"
        >
          <span class="seat-row-label">{{ rowCode }}</span>
          <div class="seat-row-list">
            <v-tooltip
              v-for="seatIndex in SEAT_COLUMNS"
              :key="`${rowCode}${seatIndex}`"
              location="top"
            >
              <template #activator="{ props: tooltipProps }">
                <button
                  v-bind="tooltipProps"
                  class="seat-item"
                  type="button"
                >
                  <span
                    class="seat-indicator"
                    :class="{
                      'seat-indicator--on-time':
                        getSeatStatus({ seatCode: `${rowCode}${seatIndex}` }) === EAttendanceStatus.ON_TIME,
                      'seat-indicator--late':
                        getSeatStatus({ seatCode: `${rowCode}${seatIndex}` }) === EAttendanceStatus.LATE,
                    }"
                  />
                  <span class="seat-label">{{ rowCode }}{{ seatIndex }}</span>
                </button>
              </template>
              <span>
                {{ getStudentAtSeat({ seatCode: `${rowCode}${seatIndex}` }) || 'Empty seat' }}
              </span>
            </v-tooltip>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.seat-map-title {
  font-family: var(--font-display) !important;
  font-size: 1.05rem !important;
}

.seat-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.seat-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--color-ink-muted);
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.seat-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.seat-legend-dot--on-time {
  background-color: var(--color-success);
}

.seat-legend-dot--late {
  background-color: var(--color-warning);
}

.seat-legend-dot--empty {
  background-color: #E8E4DC;
  border: 1px solid var(--color-border);
}

.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seat-board-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-ink-muted);
  padding: 6px;
  background: linear-gradient(135deg, rgba(44, 62, 80, 0.04), rgba(44, 62, 80, 0.08));
  border-radius: 6px;
  margin-bottom: 6px;
  font-family: var(--font-body);
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seat-row-label {
  width: 18px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  font-family: var(--font-body);
  text-align: center;
}

.seat-row-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.seat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.seat-item:hover {
  transform: scale(1.12);
}

.seat-item:focus-visible .seat-indicator {
  outline: 2px solid var(--color-accent-gold);
  outline-offset: 2px;
}

.seat-indicator {
  width: 100%;
  height: 22px;
  border-radius: 5px 5px 8px 8px;
  border: 1.5px solid var(--color-border);
  background-color: #F0EDE6;
  transition: all 0.2s ease;
}

.seat-indicator--on-time {
  background-color: var(--color-success);
  border-color: rgba(61, 139, 94, 0.6);
  box-shadow: 0 2px 6px rgba(61, 139, 94, 0.2);
}

.seat-indicator--late {
  background-color: var(--color-warning);
  border-color: rgba(212, 149, 58, 0.6);
  box-shadow: 0 2px 6px rgba(212, 149, 58, 0.2);
}

.seat-label {
  margin-top: 3px;
  font-size: 0.65rem;
  color: var(--color-ink-muted);
  font-family: var(--font-body);
  font-weight: 500;
}
</style>
