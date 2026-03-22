<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useRoute, useRouter } from 'vue-router'
  import { useColorMode } from '@/composables/use-color-mode'
  import { useAuth } from '@/composables/use-auth'
  import { useNotifications } from '@/composables/use-notifications'

  const display = useDisplay()
  const route = useRoute()
  const router = useRouter()

  const isMobile = computed(() => display.smAndDown.value)

  const drawerIsOpen = ref<boolean>(!isMobile.value)
  const drawerIsCollapsed = ref<boolean>(true)

  const { currentUser, signOut } = useAuth()
  const {
    listNotification,
    unreadCount,
    markAllRead,
    clearAll,
    formatTimeAgo,
  } = useNotifications()

  const notifMenuOpen = ref(false)

  const userDisplayName = computed(() => currentUser.value?.displayName ?? 'Teacher')

  const userAvatarUrl = computed(() => currentUser.value?.avatarUrl ?? null)

  const userInitials = computed(() => currentUser.value?.initials ?? 'U')

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      router.push({ name: 'login' })
    }
  }

  const drawerWidth = computed(() =>
    isMobile.value ? 280 : drawerIsCollapsed.value ? 72 : 220,
  )

  const pageTitle = computed(() => {
    const name = route.name as string
    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      classList: 'Classes',
      classDashboard: 'Class Details',
      schedule: 'Schedule',
      deviceConfig: 'Devices',
      godMode: 'God Mode',
    }
    return titleMap[name] || 'Dashboard'
  })

  const { isDark, toggleColorMode } = useColorMode()

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
    color="primary-darken-1"
    class="nav-drawer"
  >
    <div
      class="nav-brand pa-4 d-flex align-center"
      :class="{ 'justify-center': drawerIsCollapsed && !isMobile }"
    >
      <v-avatar color="secondary" size="36" class="nav-brand-icon">
        <v-icon color="white" size="20">mdi-school</v-icon>
      </v-avatar>
      <span v-if="!drawerIsCollapsed || isMobile" class="nav-brand-text ml-3">
        Class Presence
      </span>
    </div>

    <v-divider class="mb-2" color="rgba(255,255,255,0.08)" />

    <v-list nav density="comfortable" class="px-2">
      <v-list-item
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        value="dashboard"
        to="/dashboard"
        rounded="lg"
        class="nav-item mb-1"
      />

      <v-list-subheader v-if="!drawerIsCollapsed || isMobile" class="nav-subheader">
        Classes
      </v-list-subheader>

      <v-list-item
        prepend-icon="mdi-book-open-variant"
        title="Class List"
        value="class-list"
        to="/classes"
        rounded="lg"
        class="nav-item mb-1"
      />
      <v-list-item
        prepend-icon="mdi-calendar-clock"
        title="Schedule"
        value="sessions"
        to="/schedule"
        rounded="lg"
        class="nav-item mb-1"
      />

      <v-list-subheader v-if="!drawerIsCollapsed || isMobile" class="nav-subheader">
        System
      </v-list-subheader>

      <v-list-item
        prepend-icon="mdi-chip"
        title="Devices"
        value="device-config"
        to="/devices"
        rounded="lg"
        class="nav-item mb-1"
      />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar color="surface" flat class="app-bar-refined">
    <v-app-bar-nav-icon v-if="isMobile" color="primary" @click="toggleDrawer" />
    <v-btn
      v-else
      icon
      variant="text"
      color="primary"
      aria-label="Toggle sidebar"
      @click="toggleDrawerCollapse"
    >
      <v-icon>
        {{ drawerIsCollapsed ? 'mdi-menu' : 'mdi-menu-open' }}
      </v-icon>
    </v-btn>

    <v-app-bar-title class="app-bar-title">
      {{ pageTitle }}
    </v-app-bar-title>

    <v-spacer />

    <!-- Notification bell -->
    <v-menu
      v-model="notifMenuOpen"
      :close-on-content-click="false"
      location="bottom end"
      max-width="380"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          icon
          variant="text"
          class="mr-1"
          aria-label="Notifications"
        >
          <v-badge
            :content="unreadCount"
            :model-value="unreadCount > 0"
            color="error"
            floating
            :offset-x="-2"
            :offset-y="-2"
          >
            <v-icon>{{
              unreadCount > 0 ? 'mdi-bell-ring-outline' : 'mdi-bell-outline'
            }}</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card class="notif-dropdown" min-width="340">
        <div class="notif-header">
          <span class="notif-header__title">Notifications</span>
          <v-chip
            v-if="unreadCount > 0"
            size="x-small"
            color="error"
            variant="flat"
            class="font-weight-bold"
          >
            {{ unreadCount }} new
          </v-chip>
        </div>

        <v-divider />

        <div
          v-if="listNotification.length === 0"
          class="notif-empty"
        >
          <v-icon size="32" color="medium-emphasis" class="mb-2">mdi-bell-check-outline</v-icon>
          <div>No notifications yet</div>
        </div>

        <v-list
          v-else
          class="notif-list pa-0"
          lines="two"
        >
          <v-list-item
            v-for="n in listNotification"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.isRead }"
          >
            <template #prepend>
              <v-avatar
                size="34"
                rounded="lg"
                :color="n.color"
                variant="tonal"
              >
                <v-icon size="17">{{ n.icon }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="notif-item__title">
              {{ n.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="notif-item__message">
              {{ n.message }}
            </v-list-item-subtitle>

            <template #append>
              <span class="notif-item__time">{{ formatTimeAgo(n.timestamp) }}</span>
            </template>
          </v-list-item>
        </v-list>

        <v-divider v-if="listNotification.length > 0" />

        <div
          v-if="listNotification.length > 0"
          class="notif-actions"
        >
          <v-btn
            variant="text"
            size="small"
            class="text-none"
            prepend-icon="mdi-check-all"
            @click="markAllRead"
          >
            Mark all read
          </v-btn>
          <v-spacer />
          <v-btn
            variant="text"
            size="small"
            color="error"
            class="text-none"
            prepend-icon="mdi-notification-clear-all"
            @click="clearAll"
          >
            Clear
          </v-btn>
        </div>
      </v-card>
    </v-menu>

    <v-btn
      icon
      variant="text"
      color="primary"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      class="theme-toggle"
      :class="{ 'mr-1': !isMobile }"
      @click="toggleColorMode"
    >
      <v-icon class="theme-toggle-icon">
        {{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
      </v-icon>
    </v-btn>

    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="text"
          color="primary"
          class="user-btn"
          :icon="isMobile"
          :rounded="isMobile ? undefined : 'xl'"
        >
          <v-avatar color="secondary" size="32" :class="{ 'mr-2': !isMobile }">
            <v-img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userDisplayName" />
            <span v-else class="text-caption font-weight-bold text-white">
              {{ userInitials }}
            </span>
          </v-avatar>
          <template v-if="!isMobile">
            <span class="text-body-2 font-weight-medium text-none">
              {{ userDisplayName }}
            </span>
            <v-icon size="16" class="ml-1">mdi-chevron-down</v-icon>
          </template>
        </v-btn>
      </template>

      <v-list density="compact" min-width="180">
        <v-list-item disabled>
          <v-list-item-title class="text-caption text-medium-emphasis">
            {{ currentUser?.email }}
          </v-list-item-title>
        </v-list-item>
        <v-divider class="my-1" />
        <v-list-item prepend-icon="mdi-logout" title="Sign out" @click="handleSignOut" />
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-main>
    <slot />
  </v-main>
</template>

<style scoped>
  .nav-drawer {
    border-right: none !important;
  }

  .nav-brand {
    min-height: 64px;
  }

  .nav-brand-icon {
    flex-shrink: 0;
  }

  .nav-brand-text {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: white;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }

  .nav-item {
    color: rgba(255, 255, 255, 0.7) !important;
    transition: all 0.15s ease;
  }

  .nav-item:hover {
    color: white !important;
    background-color: rgba(255, 255, 255, 0.06) !important;
  }

  .nav-item.v-list-item--active {
    color: white !important;
    background-color: rgba(212, 168, 83, 0.18) !important;
  }

  .nav-item.v-list-item--active .v-icon {
    color: var(--color-accent-gold) !important;
  }

  .nav-subheader {
    color: rgba(255, 255, 255, 0.35) !important;
    font-size: 0.68rem !important;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: var(--font-body);
    padding-top: 12px !important;
  }

  .app-bar-refined {
    border-bottom: 1px solid var(--color-border) !important;
  }

  .app-bar-title {
    font-family: var(--font-display) !important;
    font-size: 1.2rem !important;
    color: var(--color-ink);
  }

  .user-btn {
    text-transform: none !important;
  }

  /* ── Notification dropdown ── */

  .notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
  }

  .notif-header__title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
  }

  .notif-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    color: var(--color-ink-muted);
    font-size: 0.82rem;
  }

  .notif-list {
    max-height: 340px;
    overflow-y: auto;
  }

  .notif-item {
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s;
  }

  .notif-item--unread {
    background-color: rgba(212, 168, 83, 0.06);
  }

  .notif-item__title {
    font-size: 0.78rem !important;
    font-weight: 600 !important;
  }

  .notif-item__message {
    font-size: 0.72rem !important;
  }

  .notif-item__time {
    font-size: 0.62rem;
    color: var(--color-ink-muted);
    white-space: nowrap;
  }

  .notif-actions {
    display: flex;
    align-items: center;
    padding: 8px 12px;
  }

  .theme-toggle-icon {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  }

  .theme-toggle:hover .theme-toggle-icon {
    transform: rotate(20deg);
  }
</style>
