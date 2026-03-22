<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppLayout from '../components/layout/app-layout.vue'
  import AttendanceSummaryCards from '../components/dashboard/attendance-summary-cards.vue'
  import AttendanceTable from '../components/dashboard/attendance-table.vue'
  import AttendanceRateCard from '../components/dashboard/attendance-rate-card.vue'
  import SeatMapCard from '../components/dashboard/seat-map-card.vue'
  import { useAttendance } from '@/composables/use-attendance'
  import { useClasses } from '@/composables/use-classes'
  import { useAuth } from '@/composables/use-auth'
  import { subscribeAttendance } from '@/composables/use-realtime'
  import { invokeEdgeFunction } from '@/lib/supabase'

  const route = useRoute()
  const classId = computed(() => route.params.classId as string)

  const {
    listStudentAttendance,
    attendanceStats,
    attendanceRate,
    isLoading,
    fetchAttendance,
  } = useAttendance()

  const { listClass, fetchClasses } = useClasses()
  const { currentUser } = useAuth()

  const currentClass = computed(() => listClass.value.find((c) => c.id === classId.value))

  // Email report
  const showEmailDialog = ref(false)
  const emailTo = ref('')
  const isSendingEmail = ref(false)
  const emailSnackbar = ref({ show: false, text: '', color: 'success' })

  function openEmailDialog() {
    emailTo.value = currentUser.value?.email ?? ''
    showEmailDialog.value = true
  }

  async function sendReport() {
    isSendingEmail.value = true
    const { data, error } = await invokeEdgeFunction<{
      success: boolean
      message?: string
      error?: string
    }>('send-attendance-email', {
      class_id: classId.value,
      recipient_email: emailTo.value,
    })

    showEmailDialog.value = false
    isSendingEmail.value = false

    if (error || !data?.success) {
      emailSnackbar.value = {
        show: true,
        text: error ?? data?.error ?? 'Failed to send email',
        color: 'error',
      }
    } else {
      emailSnackbar.value = {
        show: true,
        text: data.message ?? 'Report sent!',
        color: 'success',
      }
    }
  }

  const pageTitle = computed(() => {
    if (currentClass.value) {
      return `${currentClass.value.subjectName} — Student Attendance`
    }
    return 'Student Attendance'
  })

  // Export CSV
  function exportCsv() {
    const classCode = currentClass.value?.classCode ?? 'class'
    const today = new Date().toISOString().slice(0, 10)
    const header = 'MSSV,Full Name,Check-in,Seat,Status'
    const rows = listStudentAttendance.value.map((s) => {
      const status = s.status === 'ON_TIME' ? 'On Time' : s.status === 'LATE' ? 'Late' : 'Absent'
      const name = s.fullName.includes(',') ? `"${s.fullName}"` : s.fullName
      return `${s.studentCode},${name},${s.checkInTime ?? '-'},${s.seatCode ?? '-'},${status}`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${classCode}-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)

    emailSnackbar.value = {
      show: true,
      text: `Exported ${rows.length} records to CSV`,
      color: 'success',
    }
  }

  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    await Promise.all([fetchAttendance(classId.value), fetchClasses()])

    unsubscribe = subscribeAttendance(() => {
      fetchAttendance(classId.value)
    }, classId.value).unsubscribe
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-5 pa-sm-8">
      <v-row class="mb-2" align="center">
        <v-col cols="12" md="7">
          <div class="d-flex align-center mb-2">
            <v-btn
              variant="text"
              color="primary"
              size="small"
              class="text-none mr-2 px-0"
              to="/classes"
              prepend-icon="mdi-arrow-left"
            >
              Classes
            </v-btn>
          </div>
          <h1 class="page-title">
            {{ pageTitle }}
          </h1>
          <p class="page-subtitle">Track class attendance in real-time.</p>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-md-end align-end ga-3">
          <v-btn
            color="secondary"
            variant="tonal"
            class="text-none font-weight-medium"
            prepend-icon="mdi-file-download-outline"
            @click="exportCsv"
          >
            Export CSV
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none font-weight-medium"
            prepend-icon="mdi-email-outline"
            @click="openEmailDialog"
          >
            Email Report
          </v-btn>
        </v-col>
      </v-row>

      <v-row v-if="isLoading" class="mb-4">
        <v-col v-for="n in 4" :key="n" cols="6" md="3">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <template v-else>
        <AttendanceSummaryCards
          :total-student="attendanceStats.totalStudent"
          :total-on-time="attendanceStats.totalOnTime"
          :total-late="attendanceStats.totalLate"
          :total-absent="attendanceStats.totalAbsent"
        />

        <v-row>
          <v-col cols="12" lg="8">
            <AttendanceTable :list-student-attendance="listStudentAttendance" />
          </v-col>

          <v-col cols="12" lg="4">
            <AttendanceRateCard :attendance-rate="attendanceRate" class="mb-4" />
            <SeatMapCard :list-student-attendance="listStudentAttendance" />
          </v-col>
        </v-row>
      </template>
      <!-- Email Report Dialog -->
      <v-dialog v-model="showEmailDialog" max-width="440">
        <v-card>
          <v-card-title class="pa-5 pb-3 d-flex align-center ga-3">
            <v-avatar size="36" rounded="lg" color="primary" variant="tonal">
              <v-icon size="18">mdi-email-fast-outline</v-icon>
            </v-avatar>
            <div>
              <div style="font-size: 1.05rem; font-weight: 600">Send Attendance Report</div>
              <div class="text-caption text-medium-emphasis">
                {{ currentClass?.classCode }} — {{ currentClass?.subjectName }}
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Send today's attendance list with check-in times, seat numbers, and
              status (On Time / Late / Absent) to the specified email.
            </p>
            <v-text-field
              v-model="emailTo"
              label="Recipient Email"
              type="email"
              variant="outlined"
              density="comfortable"
              hide-details
              prepend-inner-icon="mdi-at"
              placeholder="teacher@school.edu"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4 justify-end ga-3">
            <v-btn
              variant="text"
              class="text-none"
              @click="showEmailDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="text-none font-weight-medium"
              prepend-icon="mdi-send"
              :loading="isSendingEmail"
              :disabled="!emailTo.trim() || !emailTo.includes('@')"
              @click="sendReport"
            >
              Send Report
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar
        v-model="emailSnackbar.show"
        :color="emailSnackbar.color"
        :timeout="4000"
        location="bottom end"
      >
        {{ emailSnackbar.text }}
      </v-snackbar>
    </v-container>
  </AppLayout>
</template>
