<script setup lang="ts">
const props = defineProps<{
  totalStudent: number;
  totalOnTime: number;
  totalLate: number;
  totalAbsent: number;
}>();
</script>

<template>
  <v-row class="mb-6" dense>
    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1">
        <v-card-text class="d-flex flex-column">
          <span class="text-caption text-medium-emphasis mb-1">
            Total Students
          </span>
          <span class="text-h4 font-weight-medium">
            {{ props.totalStudent }}
          </span>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1">
        <v-card-text class="d-flex flex-column">
          <span class="text-caption text-medium-emphasis mb-1"> On Time </span>
          <span class="text-h4 font-weight-medium text-success">
            {{ props.totalOnTime }}
          </span>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1">
        <v-card-text class="d-flex flex-column">
          <span class="text-caption text-medium-emphasis mb-1"> Late </span>
          <span class="text-h4 font-weight-medium text-warning-darken-1">
            {{ props.totalLate }}
          </span>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1">
        <v-card-text class="d-flex flex-column">
          <span class="text-caption text-medium-emphasis mb-1"> Absent </span>
          <span class="text-h4 font-weight-medium text-error">
            {{ props.totalAbsent }}
          </span>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
