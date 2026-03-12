import { computed } from 'vue'
import { useTheme } from 'vuetify'

const STORAGE_KEY = 'class-presence-theme'
const LIGHT_THEME = 'scholarly'
const DARK_THEME = 'scholarly-dark'

export function useColorMode() {
  const theme = useTheme()

  const isDark = computed(() => theme.global.current.value.dark)

  function toggleColorMode() {
    const next = isDark.value ? LIGHT_THEME : DARK_THEME
    theme.global.name.value = next
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { isDark, toggleColorMode }
}
