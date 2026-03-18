import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { IAuthUser } from '@/types/auth'

const currentUser = ref<IAuthUser | null>(null)
const isAuthLoading = ref(true)

const mapUser = (user: User | null): IAuthUser | null => {
  if (!user) {
    return null
  }

  const rawFullName = user.user_metadata?.full_name
  const displayName =
    (typeof rawFullName === 'string' && rawFullName.trim().length > 0
      ? rawFullName
      : user.email) || 'User'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0] ?? '')
    .join('')
    .toUpperCase()

  return {
    id: user.id,
    email: user.email ?? '',
    displayName,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : null,
    initials,
  }
}

supabase.auth.getSession().then(({ data }) => {
  currentUser.value = mapUser(data.session?.user ?? null)
  isAuthLoading.value = false
})

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser.value = mapUser(session?.user ?? null)
  isAuthLoading.value = false
})

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)

  const signInWithGoogle = async () => {
    const redirectTo =
      typeof window === 'undefined' ? undefined : `${window.location.origin}/dashboard`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { currentUser, isAuthLoading, isAuthenticated, signInWithGoogle, signOut }
}
