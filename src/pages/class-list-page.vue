<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AppLayout from '../components/layout/app-layout.vue'

  interface IClassItem {
    id: string
    name: string
    code: string
    studentCount: number
    room: string
  }

  const listClass = ref<IClassItem[]>([
    {
      id: 'class-iot-10',
      name: 'IoT Class — Group 10',
      code: 'IOT101-10',
      studentCount: 45,
      room: 'Room 202',
    },
    {
      id: 'class-ai-01',
      name: 'AI Class — Group 01',
      code: 'AI201-01',
      studentCount: 50,
      room: 'Room 305',
    },
    {
      id: 'class-blockchain-03',
      name: 'Blockchain Class — Group 03',
      code: 'BC301-03',
      studentCount: 40,
      room: 'Room 407',
    },
  ])

  const router = useRouter()

  function goToClassDashboard({ classId }: { classId: string }) {
    router.push({ name: 'classDashboard', params: { classId } })
  }
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-4 pa-sm-6">
      <v-row class="mb-4" align="center" justify="space-between">
        <v-col cols="12" md="6">
          <h1 class="text-h5 text-sm-h4 font-weight-medium mb-1">Class List</h1>
          <p class="text-body-2 text-medium-emphasis">
            Select a class to view detailed attendance statistics.
          </p>
        </v-col>
      </v-row>

      <v-card rounded="lg" flat>
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Class Code</th>
              <th class="text-left">Class Name</th>
              <th class="text-left">Room</th>
              <th class="text-left">Students</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="classItem in listClass"
              :key="classItem.id"
              class="cursor-pointer"
              @click="goToClassDashboard({ classId: classItem.id })"
            >
              <td class="text-body-2 font-weight-medium">
                {{ classItem.code }}
              </td>
              <td class="text-body-2">
                {{ classItem.name }}
              </td>
              <td class="text-body-2">
                {{ classItem.room }}
              </td>
              <td class="text-body-2">
                {{ classItem.studentCount }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-container>
  </AppLayout>
</template>
