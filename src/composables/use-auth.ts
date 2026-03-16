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

  const displayName =
    (user.user_metadata?.full_name as string) || user.email || 'User'
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
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
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
