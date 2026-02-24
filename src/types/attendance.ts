export type TAttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT'

export interface IStudentAttendance {
  id: string
  studentCode: string
  fullName: string
  status: TAttendanceStatus
  checkInTime: string | null
  seatCode: string | null
}

