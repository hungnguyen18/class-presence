import type { TAttendanceStatus } from './attendance'

export const EDeviceStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
} as const

export type TDeviceStatus = (typeof EDeviceStatus)[keyof typeof EDeviceStatus]

export const EDeviceCommand = {
  POWER_ON: 'POWER_ON',
  POWER_OFF: 'POWER_OFF',
  RESTART: 'RESTART',
  SYNC_TIME: 'SYNC_TIME',
  UPDATE_FW: 'UPDATE_FW',
} as const

export type TDeviceCommand = (typeof EDeviceCommand)[keyof typeof EDeviceCommand]

export const ECommandStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  EXECUTED: 'EXECUTED',
  FAILED: 'FAILED',
} as const

export type TCommandStatus = (typeof ECommandStatus)[keyof typeof ECommandStatus]

export interface IRoom {
  id: string
  name: string
  capacity: number
  createdAt: string
}

export interface IClass {
  id: string
  classCode: string
  subjectName: string
  startTime: string
  endTime: string
  roomId: string
  createdAt: string
}

export interface IStudent {
  id: string
  mssv: string
  fullName: string
  seatNumber: string | null
  classId: string
  createdAt: string
}

export interface IDevice {
  id: string
  deviceCode: string
  description: string | null
  roomId: string
  status: TDeviceStatus
  lastSeen: string | null
  firmwareVersion: string | null
  createdAt: string
}

export interface IAttendanceLog {
  id: string
  studentId: string
  classId: string
  deviceId: string | null
  checkinTime: string
  status: TAttendanceStatus
  seatNumber: string | null
}

export interface IAttendanceSession {
  id: string
  studentId: string
  classId: string
  deviceId: string | null
  checkinTime: string
  checkoutTime: string | null
  status: TAttendanceStatus
  createdAt: string
}

export interface IDeviceCommand {
  id: string
  deviceId: string
  command: TDeviceCommand
  payload: Record<string, unknown> | null
  status: TCommandStatus
  executedAt: string | null
  createdAt: string
}

// Joined types for UI — room/student can be null when join returns no match
export type IClassWithRoom = IClass & { room: IRoom | null }
export type IDeviceWithRoom = IDevice & { room: IRoom | null }
export type IAttendanceLogWithStudent = IAttendanceLog & {
  student: Pick<IStudent, 'mssv' | 'fullName'> | null
}
