<script setup lang="ts">
  import { useAuth } from '@/composables/use-auth'
  import { useColorMode } from '@/composables/use-color-mode'

  const { signInWithGoogle, isAuthLoading } = useAuth()
  const { isDark, toggleColorMode } = useColorMode()
</script>

<template>
  <div class="login-root">
    <v-btn
      icon
      variant="text"
      color="primary"
      class="theme-toggle"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleColorMode"
    >
      <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <v-container class="fill-height flex-grow-1" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="5" lg="4" xl="3">
          <div class="text-center mb-8 animate-in">
            <v-avatar color="secondary" size="56" class="mb-4">
              <v-icon color="white" size="28">mdi-school</v-icon>
            </v-avatar>
            <h1 class="login-title">Class Presence</h1>
            <p class="page-subtitle">Teacher attendance management</p>
          </div>

          <v-card class="pa-6 animate-in animate-delay-1">
            <v-card-text class="text-center pb-2">
              <h2 class="login-heading mb-1">Welcome back</h2>
              <p class="text-body-2 text-medium-emphasis">
                Sign in with your school Google account
              </p>
            </v-card-text>

            <v-divider class="my-4" />

            <v-card-text>
              <v-btn
                block
                size="large"
                variant="outlined"
                color="primary"
                class="text-none font-weight-medium"
                :loading="isAuthLoading"
                prepend-icon="mdi-google"
                @click="signInWithGoogle"
              >
                Continue with Google
              </v-btn>
            </v-card-text>

            <v-card-text class="text-center pt-0">
              <p class="text-caption text-medium-emphasis">
                Only authorized school accounts can access this system
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
  .login-root {
    min-height: 100vh;
    min-height: 100dvh;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1;
  }

  .login-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    color: var(--color-ink);
    margin-bottom: 4px;
  }

  .login-heading {
    font-family: var(--font-display);
    font-size: 1.25rem;
    color: var(--color-ink);
  }

  @media (max-width: 600px) {
    .login-title {
      font-size: 1.5rem;
    }
  }
</style>
