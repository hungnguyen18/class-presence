export const EAttendanceStatus = {
  ON_TIME: 'ON_TIME',
  LATE: 'LATE',
  ABSENT: 'ABSENT',
} as const

export type TAttendanceStatus = (typeof EAttendanceStatus)[keyof typeof EAttendanceStatus]

export function isAttendanceStatus(value: unknown): value is TAttendanceStatus {
  return (
    value === EAttendanceStatus.ON_TIME ||
    value === EAttendanceStatus.LATE ||
    value === EAttendanceStatus.ABSENT
  )
}

export interface IStudentAttendance {
  id: string
  studentCode: string
  fullName: string
  status: TAttendanceStatus
  checkInTime: string | null
  seatCode: string | null
}
