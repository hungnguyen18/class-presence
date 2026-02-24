<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'

  const drawerIsOpen = ref<boolean>(true)
  const drawerIsCollapsed = ref<boolean>(true)

  const display = useDisplay()

  const isMobile = computed(() => display.smAndDown.value)

  const drawerWidth = computed(() =>
    isMobile.value ? 260 : drawerIsCollapsed.value ? 72 : 200,
  )

  function toggleDrawer() {
    drawerIsOpen.value = !drawerIsOpen.value
  }

  function toggleDrawerCollapse() {
    if (isMobile.value) {
      return
    }

    drawerIsCollapsed.value = !drawerIsCollapsed.value
  }
</script>

<template>
  <v-navigation-drawer
    v-model="drawerIsOpen"
    :permanent="!isMobile"
    :temporary="isMobile"
    :rail="!isMobile && drawerIsCollapsed"
    :width="drawerWidth"
  >
    <v-list nav density="comfortable">
      <v-list-item
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        value="dashboard"
        to="/dashboard"
      />
      <v-divider class="my-2" />
      <v-list-subheader v-if="!drawerIsCollapsed">Classes</v-list-subheader>
      <v-list-item
        prepend-icon="mdi-format-list-bulleted"
        title="Class List"
        value="class-list"
        to="/classes"
      />
      <v-list-item
        prepend-icon="mdi-calendar-clock"
        title="Session Schedule"
        value="sessions"
      />
      <v-divider class="my-2" />
      <v-list-subheader v-if="!drawerIsCollapsed">IoT Devices</v-list-subheader>
      <v-list-item
        prepend-icon="mdi-chip"
        title="Device Config"
        value="device-config"
        to="/devices"
      />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar color="primary">
    <v-app-bar-nav-icon v-if="isMobile" @click="toggleDrawer" />
    <v-btn
      v-else
      icon
      variant="text"
      color="on-primary"
      aria-label="Toggle sidebar"
      @click="toggleDrawerCollapse"
    >
      <v-icon>
        {{ drawerIsCollapsed ? 'mdi-menu-open' : 'mdi-menu' }}
      </v-icon>
    </v-btn>
    <v-app-bar-title> Dashboard </v-app-bar-title>

    <v-btn
      icon="mdi-bell-outline"
      variant="text"
      color="on-primary"
      aria-label="Notifications"
    />
    <v-btn icon="mdi-account-circle" rounded="full" />
  </v-app-bar>

  <v-main>
    <slot />
  </v-main>
</template>
