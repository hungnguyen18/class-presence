import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

type TEmailRequest = {
  class_id: string
  recipient_email: string
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

  if (!RESEND_API_KEY) {
    return jsonResponse({ success: false, error: 'RESEND_API_KEY not configured' }, 500)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const body = (await req.json()) as TEmailRequest

  // 1. Get class info
  const { data: classData } = await supabase
    .from('cp_classes')
    .select('id, class_code, subject_name, start_time, end_time')
    .eq('id', body.class_id)
    .single()

  if (!classData) {
    return jsonResponse({ success: false, error: 'Class not found' }, 404)
  }

  // 2. Get all students in this class
  const { data: listStudent } = await supabase
    .from('cp_students')
    .select('id, mssv, full_name, seat_number')
    .eq('class_id', body.class_id)
    .order('mssv')

  if (!listStudent || listStudent.length === 0) {
    return jsonResponse({ success: false, error: 'No students in this class' }, 404)
  }

  // 3. Get today's attendance logs
  const now = new Date()
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const todayStr = vnNow.toISOString().slice(0, 10)

  const { data: listLog } = await supabase
    .from('cp_attendance_logs')
    .select('student_id, status, checkin_time, seat_number')
    .eq('class_id', body.class_id)
    .gte('checkin_time', `${todayStr}T00:00:00`)
    .lt('checkin_time', `${todayStr}T23:59:59`)

  // 4. Build attendance map
  const logMap: Record<string, { status: string; time: string; seat: string }> = {}
  for (let i = 0; i < (listLog ?? []).length; i += 1) {
    const log = listLog![i]!
    logMap[log.student_id] = {
      status: log.status,
      time: log.checkin_time?.slice(11, 16) ?? '--:--',
      seat: log.seat_number ?? '-',
    }
  }

  // 5. Build student rows
  let onTimeCount = 0
  let lateCount = 0
  let absentCount = 0

  const listRow: string[] = []
  for (let i = 0; i < listStudent.length; i += 1) {
    const s = listStudent[i]!
    const log = logMap[s.id]
    let status = 'ABSENT'
    let time = '-'
    let seat = s.seat_number ?? '-'
    let statusColor = '#C0544F'
    let statusBg = '#fde8e8'

    if (log) {
      status = log.status
      time = log.time
      seat = log.seat ?? seat
      if (status === 'ON_TIME') {
        statusColor = '#3D8B5E'
        statusBg = '#e6f4ec'
        onTimeCount += 1
      } else if (status === 'LATE') {
        statusColor = '#D4953A'
        statusBg = '#fef3e2'
        lateCount += 1
      }
    } else {
      absentCount += 1
    }

    const statusLabel = status === 'ON_TIME' ? 'On Time' : status === 'LATE' ? 'Late' : 'Absent'

    listRow.push(`
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px;">${s.mssv}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px;">${s.full_name}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px; text-align: center;">${time}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px; text-align: center;">${seat}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #eee; text-align: center;">
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: ${statusColor}; background: ${statusBg};">${statusLabel}</span>
        </td>
      </tr>
    `)
  }

  const totalStudent = listStudent.length
  const attendanceRate = totalStudent > 0 ? Math.round(((onTimeCount + lateCount) / totalStudent) * 100) : 0

  // 6. Build HTML email
  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
    <div style="max-width: 680px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a2332; border-radius: 12px 12px 0 0; padding: 24px 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Attendance Report</h1>
        <p style="color: #8a9bb0; margin: 6px 0 0; font-size: 14px;">${classData.subject_name} (${classData.class_code})</p>
      </div>

      <div style="background: #fff; padding: 24px 30px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <div style="flex: 1; background: #e6f4ec; border-radius: 8px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #3D8B5E;">${onTimeCount}</div>
            <div style="font-size: 12px; color: #3D8B5E; text-transform: uppercase; letter-spacing: 0.05em;">On Time</div>
          </div>
          <div style="flex: 1; background: #fef3e2; border-radius: 8px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #D4953A;">${lateCount}</div>
            <div style="font-size: 12px; color: #D4953A; text-transform: uppercase; letter-spacing: 0.05em;">Late</div>
          </div>
          <div style="flex: 1; background: #fde8e8; border-radius: 8px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #C0544F;">${absentCount}</div>
            <div style="font-size: 12px; color: #C0544F; text-transform: uppercase; letter-spacing: 0.05em;">Absent</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #f8f8f8;">
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #666;">MSSV</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #666;">Full Name</th>
              <th style="padding: 10px 14px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #666;">Check-in</th>
              <th style="padding: 10px 14px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #666;">Seat</th>
              <th style="padding: 10px 14px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #666;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${listRow.join('')}
          </tbody>
        </table>

        <div style="background: #f8f8f8; border-radius: 8px; padding: 14px; text-align: center; font-size: 13px; color: #666;">
          Date: ${todayStr} &nbsp;|&nbsp; Schedule: ${classData.start_time?.slice(0, 5)} - ${classData.end_time?.slice(0, 5)} &nbsp;|&nbsp; Attendance Rate: <strong>${attendanceRate}%</strong>
        </div>
      </div>

      <div style="background: #1a2332; border-radius: 0 0 12px 12px; padding: 16px 30px; text-align: center;">
        <p style="color: #8a9bb0; margin: 0; font-size: 12px;">Class Presence System &mdash; Automated Attendance Report</p>
      </div>
    </div>
  </body>
  </html>
  `

  // 7. Send via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Class Presence <onboarding@resend.dev>',
      to: body.recipient_email,
      subject: `[${classData.class_code}] Attendance Report — ${todayStr}`,
      html,
    }),
  })

  const emailResult = await emailRes.json()

  if (!emailRes.ok) {
    return jsonResponse(
      { success: false, error: emailResult.message ?? 'Failed to send email' },
      500,
    )
  }

  return jsonResponse({
    success: true,
    message: `Report sent to ${body.recipient_email}`,
    stats: { onTime: onTimeCount, late: lateCount, absent: absentCount, total: totalStudent },
  })
})
