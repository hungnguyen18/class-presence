export interface IAuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  initials: string
}

declare module 'vue-router' {
  interface RouteMeta {
    isPublic?: boolean
  }
}
