<script setup lang="ts">
  import AppLayout from '../components/layout/app-layout.vue'
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-4 pa-sm-6">
      <v-row class="mb-4">
        <v-col cols="12">
          <h1 class="text-h5 text-sm-h4 font-weight-medium mb-1">
            Dashboard hệ thống điểm danh
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            Trang tổng quan chung. Nội dung sẽ được cập nhật sau khi xác định yêu cầu hiển thị.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg" class="mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-medium">
              Trạng thái hoạt động
            </v-card-title>
            <v-card-text class="text-body-2 text-medium-emphasis">
              Khu vực này sẽ hiển thị các chỉ số hệ thống (số lớp, số buổi học, tình trạng hoạt động
              real-time, v.v.).
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="lg" class="mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-medium">
              Hoạt động gần đây
            </v-card-title>
            <v-card-text class="text-body-2 text-medium-emphasis">
              Placeholder cho log hoạt động gần đây, báo cáo nhanh hoặc cảnh báo hệ thống.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

