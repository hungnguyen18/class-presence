import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TSeedRequest = {
  action: 'clear' | 'seed' | 'counts'
  listMssv?: string[]
  startTime?: string
  endTime?: string
}

type TCountResult = {
  room: number
  class: number
  student: number
  device: number
  attendanceLog: number
  attendanceSession: number
}

const LIST_VIETNAMESE_NAME = [
  'Nguyen Van An',
  'Tran Thi Bich',
  'Le Hoang Cuong',
  'Pham Minh Duc',
  'Vo Thi Em',
  'Hoang Van Phuc',
  'Bui Thi Giang',
  'Dang Quoc Huy',
  'Ngo Thi Lan',
  'Do Van Khanh',
  'Ly Thi Mai',
  'Truong Van Nam',
  'Duong Thi Oanh',
  'Phan Van Phong',
  'Huynh Thi Quyen',
  'Vu Van Sang',
  'Mai Thi Thao',
  'Dinh Van Ung',
  'Cao Thi Van',
  'Luu Van Xuan',
  'Ton Thi Yen',
  'Tang Van Binh',
  'Ha Thi Cam',
  'Trinh Van Dat',
  'Luong Thi Hoa',
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const body = (await req.json()) as TSeedRequest

  switch (body.action) {
    case 'counts':
      return await handleCounts(supabase)
    case 'clear':
      return await handleClear(supabase)
    case 'seed':
      return await handleSeed(supabase, body.listMssv ?? [], body.startTime, body.endTime)
    default:
      return jsonResponse(
        { success: false, message: `Unknown action: ${body.action}` },
        400,
      )
  }
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ─── COUNTS ───

async function handleCounts(supabase: ReturnType<typeof createClient>) {
  const [roomR, classR, studentR, deviceR, logR, sessionR] = await Promise.all([
    supabase.from('cp_rooms').select('id', { count: 'exact', head: true }),
    supabase.from('cp_classes').select('id', { count: 'exact', head: true }),
    supabase.from('cp_students').select('id', { count: 'exact', head: true }),
    supabase.from('cp_devices').select('id', { count: 'exact', head: true }),
    supabase.from('cp_attendance_logs').select('id', { count: 'exact', head: true }),
    supabase.from('cp_attendance_sessions').select('id', { count: 'exact', head: true }),
  ])

  const counts: TCountResult = {
    room: roomR.count ?? 0,
    class: classR.count ?? 0,
    student: studentR.count ?? 0,
    device: deviceR.count ?? 0,
    attendanceLog: logR.count ?? 0,
    attendanceSession: sessionR.count ?? 0,
  }

  return jsonResponse({ success: true, message: 'Counts fetched', counts })
}

// ─── CLEAR ───

async function handleClear(supabase: ReturnType<typeof createClient>) {
  const listTable = [
    'cp_attendance_sessions',
    'cp_attendance_logs',
    'cp_device_commands',
    'cp_students',
    'cp_classes',
    'cp_devices',
    'cp_rooms',
  ]

  for (let i = 0; i < listTable.length; i += 1) {
    const table = listTable[i]!
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) {
      return jsonResponse(
        {
          success: false,
          message: `Failed to clear ${table}: ${error.message}`,
        },
        500,
      )
    }
  }

  return jsonResponse({ success: true, message: 'All data cleared' })
}

// ─── SEED ───

async function handleSeed(supabase: ReturnType<typeof createClient>, listMssv: string[], startTime?: string, endTime?: string) {
  // 1. Insert rooms
  const { data: listRoom, error: roomError } = await supabase
    .from('cp_rooms')
    .insert([
      { name: 'Room A101', capacity: 40 },
      { name: 'Room A102', capacity: 35 },
      { name: 'Room B201', capacity: 50 },
      { name: 'Room B202', capacity: 30 },
    ])
    .select('id, name')

  if (roomError || !listRoom) {
    return jsonResponse(
      { success: false, message: `Room insert failed: ${roomError?.message}` },
      500,
    )
  }

  const roomMap: Record<string, string> = {}
  for (let i = 0; i < listRoom.length; i += 1) {
    roomMap[listRoom[i]!.name] = listRoom[i]!.id
  }

  // 2. Insert devices
  const { data: listDevice, error: deviceError } = await supabase
    .from('cp_devices')
    .insert([
      {
        device_code: 'IOT-A101-01',
        description: 'Main IoT sensor - Room A101',
        room_id: roomMap['Room A101'],
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        firmware_version: '2.1.0',
      },
      {
        device_code: 'IOT-A102-01',
        description: 'IoT sensor - Room A102',
        room_id: roomMap['Room A102'],
        status: 'OFFLINE',
        firmware_version: '2.0.3',
      },
      {
        device_code: 'IOT-B201-01',
        description: 'IoT sensor - Room B201',
        room_id: roomMap['Room B201'],
        status: 'OFFLINE',
        firmware_version: '1.9.8',
      },
    ])
    .select('id, device_code')

  if (deviceError || !listDevice) {
    return jsonResponse(
      {
        success: false,
        message: `Device insert failed: ${deviceError?.message}`,
      },
      500,
    )
  }

  const deviceIdMap: Record<string, string> = {}
  for (let i = 0; i < listDevice.length; i += 1) {
    deviceIdMap[listDevice[i]!.device_code] = listDevice[i]!.id
  }

  // 3. Insert classes — demo class has dynamic time (current hour window)
  const now = new Date()
  let demoStart: string
  let demoEnd: string
  if (startTime && endTime) {
    demoStart = startTime
    demoEnd = endTime
  } else {
    const clampedHour = Math.max(7, Math.min(now.getHours(), 15))
    demoStart = `${String(clampedHour).padStart(2, '0')}:00`
    demoEnd = `${String(clampedHour + 2).padStart(2, '0')}:00`
  }

  const { data: listClass, error: classError } = await supabase
    .from('cp_classes')
    .insert([
      {
        class_code: 'IOT301',
        subject_name: 'Introduction to IoT',
        start_time: demoStart,
        end_time: demoEnd,
        room_id: roomMap['Room A101'],
      },
      {
        class_code: 'AI201',
        subject_name: 'AI Fundamentals',
        start_time: '09:00',
        end_time: '11:00',
        room_id: roomMap['Room A102'],
      },
      {
        class_code: 'BC401',
        subject_name: 'Blockchain Technology',
        start_time: '13:00',
        end_time: '15:00',
        room_id: roomMap['Room B201'],
      },
      {
        class_code: 'SE301',
        subject_name: 'Software Engineering',
        start_time: '15:00',
        end_time: '17:00',
        room_id: roomMap['Room B202'],
      },
      {
        class_code: 'DS201',
        subject_name: 'Data Science',
        start_time: '08:00',
        end_time: '10:00',
        room_id: roomMap['Room B201'],
      },
    ])
    .select('id, class_code')

  if (classError || !listClass) {
    return jsonResponse(
      {
        success: false,
        message: `Class insert failed: ${classError?.message}`,
      },
      500,
    )
  }

  const classIdMap: Record<string, string> = {}
  for (let i = 0; i < listClass.length; i += 1) {
    classIdMap[listClass[i]!.class_code] = listClass[i]!.id
  }

  // 4. Insert students
  const listStudentRow: Array<{
    mssv: string
    full_name: string
    seat_number: string
    class_id: string
  }> = []

  // Demo class students (from listMssv)
  const demoClassId = classIdMap['IOT301']!
  for (let i = 0; i < listMssv.length; i += 1) {
    const row = String.fromCharCode(65 + Math.floor(i / 5))
    const col = (i % 5) + 1
    listStudentRow.push({
      mssv: listMssv[i]!,
      full_name: LIST_VIETNAMESE_NAME[i % LIST_VIETNAMESE_NAME.length]!,
      seat_number: `${row}${String(col).padStart(2, '0')}`,
      class_id: demoClassId,
    })
  }

  // Other classes — 20-25 students each
  const listOtherClass = ['AI201', 'BC401', 'SE301', 'DS201']
  let mssvCounter = 22810001
  for (let c = 0; c < listOtherClass.length; c += 1) {
    const classId = classIdMap[listOtherClass[c]!]!
    const studentCount = 20 + Math.floor((c * 7) % 6) // 20-25 deterministic
    for (let s = 0; s < studentCount; s += 1) {
      const row = String.fromCharCode(65 + Math.floor(s / 5))
      const col = (s % 5) + 1
      listStudentRow.push({
        mssv: String(mssvCounter),
        full_name: LIST_VIETNAMESE_NAME[(c * 7 + s) % LIST_VIETNAMESE_NAME.length]!,
        seat_number: `${row}${String(col).padStart(2, '0')}`,
        class_id: classId,
      })
      mssvCounter += 1
    }
  }

  const { error: studentError } = await supabase
    .from('cp_students')
    .insert(listStudentRow)

  if (studentError) {
    return jsonResponse(
      {
        success: false,
        message: `Student insert failed: ${studentError.message}`,
      },
      500,
    )
  }

  // 5. Fetch inserted students for attendance log generation
  const { data: listAllStudent } = await supabase
    .from('cp_students')
    .select('id, class_id')

  if (!listAllStudent) {
    return jsonResponse({
      success: true,
      message: 'Seeded rooms, devices, classes, students (no attendance logs)',
    })
  }

  // Group students by class
  const studentByClass: Record<string, string[]> = {}
  for (let i = 0; i < listAllStudent.length; i += 1) {
    const s = listAllStudent[i]!
    if (!studentByClass[s.class_id]) {
      studentByClass[s.class_id] = []
    }
    studentByClass[s.class_id]!.push(s.id)
  }

  // 6. Generate attendance logs
  const listAttendanceLog: Array<{
    student_id: string
    class_id: string
    device_id: string | null
    checkin_time: string
    status: string
    seat_number: string | null
  }> = []

  const listStatus = ['ON_TIME', 'LATE', 'ABSENT']

  // Non-demo classes: past 5 days
  for (let c = 0; c < listOtherClass.length; c += 1) {
    const classCode = listOtherClass[c]!
    const classId = classIdMap[classCode]!
    const listStudentId = studentByClass[classId] ?? []
    const deviceCode =
      classCode === 'AI201' ? 'IOT-A102-01' : classCode === 'BC401' ? 'IOT-B201-01' : null
    const deviceId = deviceCode ? (deviceIdMap[deviceCode] ?? null) : null

    for (let day = 1; day <= 5; day += 1) {
      const date = new Date(now)
      date.setDate(date.getDate() - day)
      const dateStr = date.toISOString().slice(0, 10)

      for (let s = 0; s < listStudentId.length; s += 1) {
        // Deterministic status: ~70% ON_TIME, ~20% LATE, ~10% ABSENT
        const hash = (c * 1000 + day * 100 + s) % 10
        let status: string
        if (hash < 7) {
          status = listStatus[0]! // ON_TIME
        } else if (hash < 9) {
          status = listStatus[1]! // LATE
        } else {
          status = listStatus[2]! // ABSENT
        }

        if (status === 'ABSENT') {
          continue // absent students have no check-in log
        }

        const minuteOffset = status === 'LATE' ? 15 + (s % 20) : s % 10
        const checkinTime = `${dateStr}T08:${String(minuteOffset).padStart(2, '0')}:00+07:00`

        listAttendanceLog.push({
          student_id: listStudentId[s]!,
          class_id: classId,
          device_id: deviceId,
          checkin_time: checkinTime,
          status,
          seat_number: null,
        })
      }
    }
  }

  // Demo class: TODAY, partial check-in (~50%)
  const demoStudentIds = studentByClass[demoClassId] ?? []
  const demoDeviceId = deviceIdMap['IOT-A101-01'] ?? null
  const todayStr = now.toISOString().slice(0, 10)

  for (let s = 0; s < Math.ceil(demoStudentIds.length / 2); s += 1) {
    const status = s % 3 === 0 ? 'LATE' : 'ON_TIME'
    const minuteOffset = status === 'LATE' ? 10 + s : s * 2
    const checkinTime = `${todayStr}T${demoStart.slice(0, 2)}:${String(minuteOffset).padStart(2, '0')}:00+07:00`

    listAttendanceLog.push({
      student_id: demoStudentIds[s]!,
      class_id: demoClassId,
      device_id: demoDeviceId,
      checkin_time: checkinTime,
      status,
      seat_number: null,
    })
  }

  // Batch insert attendance logs
  if (listAttendanceLog.length > 0) {
    const { error: logError } = await supabase
      .from('cp_attendance_logs')
      .insert(listAttendanceLog)

    if (logError) {
      return jsonResponse(
        {
          success: false,
          message: `Attendance log insert failed: ${logError.message}`,
        },
        500,
      )
    }
  }

  return jsonResponse({
    success: true,
    message: `Seeded: 4 rooms, 3 devices, 5 classes, ${listStudentRow.length} students, ${listAttendanceLog.length} attendance logs`,
    counts: {
      room: 4,
      class: 5,
      student: listStudentRow.length,
      device: 3,
      attendanceLog: listAttendanceLog.length,
      attendanceSession: 0,
    },
  })
}
