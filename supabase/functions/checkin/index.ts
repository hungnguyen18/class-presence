import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TCheckinRequest = {
  mssv: string
  device_code: string
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const body = (await req.json()) as TCheckinRequest

  // 1. Find device by device_code
  const { data: device, error: deviceError } = await supabase
    .from('cp_devices')
    .select('id, room_id')
    .eq('device_code', body.device_code)
    .single()

  if (deviceError || !device) {
    return jsonResponse({ success: false, error: 'DEVICE_NOT_FOUND' }, 404)
  }

  // 2. Find active class for this room right now (Vietnam timezone UTC+7)
  const now = new Date()
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const currentTime = `${String(vnNow.getUTCHours()).padStart(2, '0')}:${String(vnNow.getUTCMinutes()).padStart(2, '0')}`

  const { data: activeClass, error: classError } = await supabase
    .from('cp_classes')
    .select('id, start_time, end_time')
    .eq('room_id', device.room_id)
    .lte('start_time', currentTime)
    .gte('end_time', currentTime)
    .single()

  if (classError || !activeClass) {
    return jsonResponse({ success: false, error: 'NO_ACTIVE_CLASS' }, 404)
  }

  // 3. Find student by mssv in this class
  const { data: student, error: studentError } = await supabase
    .from('cp_students')
    .select('id, full_name, seat_number')
    .eq('mssv', body.mssv)
    .eq('class_id', activeClass.id)
    .single()

  if (studentError || !student) {
    return jsonResponse({ success: false, error: 'STUDENT_NOT_FOUND' }, 404)
  }

  // 4. Check duplicate: already checked in today for this class
  const todayStr = now.toISOString().slice(0, 10)
  const { data: existingLog } = await supabase
    .from('cp_attendance_logs')
    .select('id')
    .eq('student_id', student.id)
    .eq('class_id', activeClass.id)
    .gte('checkin_time', `${todayStr}T00:00:00`)
    .lt('checkin_time', `${todayStr}T23:59:59`)
    .limit(1)

  if (existingLog && existingLog.length > 0) {
    return jsonResponse({ success: false, error: 'ALREADY_CHECKED_IN' }, 409)
  }

  // 5. Determine status: if current time > start_time + 15 minutes -> LATE
  const [startHour, startMinute] = activeClass.start_time.split(':').map(Number)
  const startTotalMinute = startHour * 60 + startMinute
  const currentTotalMinute = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes()
  const status = currentTotalMinute > startTotalMinute + 15 ? 'LATE' : 'ON_TIME'

  // 6. Insert attendance log
  const { error: insertError } = await supabase
    .from('cp_attendance_logs')
    .insert({
      student_id: student.id,
      class_id: activeClass.id,
      device_id: device.id,
      checkin_time: now.toISOString(),
      status,
      seat_number: student.seat_number,
    })

  if (insertError) {
    return jsonResponse(
      { success: false, error: `INSERT_FAILED: ${insertError.message}` },
      500,
    )
  }

  return jsonResponse({
    success: true,
    name: student.full_name,
    status,
  })
})
