import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthAdapter, AuthUser } from '../types'

export interface SupabaseAuthAdapterOptions {
  client: SupabaseClient
  adminRoles?: string[]
  getUserProfile?: (
    userId: string
  ) => Promise<{ name?: string; role?: string; organizationId?: string } | null>
}

export function createSupabaseAuthAdapter(
  options: SupabaseAuthAdapterOptions
): AuthAdapter {
  const { client, adminRoles = ['admin', 'superadmin'], getUserProfile } = options

  return {
    async getCurrentUser(): Promise<AuthUser | null> {
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) return null

      const profile = getUserProfile ? await getUserProfile(user.id) : null

      return {
        id: user.id,
        email: user.email ?? '',
        name: profile?.name ?? user.user_metadata?.name,
        role: profile?.role ?? user.user_metadata?.role,
        organizationId: profile?.organizationId,
        metadata: user.user_metadata,
      }
    },

    async signInWithPassword(
      email: string,
      password: string
    ): Promise<AuthUser> {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!data.user) throw new Error('No user returned from sign in')

      const profile = getUserProfile ? await getUserProfile(data.user.id) : null

      return {
        id: data.user.id,
        email: data.user.email ?? '',
        name: profile?.name ?? data.user.user_metadata?.name,
        role: profile?.role ?? data.user.user_metadata?.role,
        organizationId: profile?.organizationId,
        metadata: data.user.user_metadata,
      }
    },

    async signOut(): Promise<void> {
      const { error } = await client.auth.signOut()
      if (error) throw error
    },

    hasRole(user: AuthUser, role: string): boolean {
      return user.role === role
    },

    async getUserById(id: string): Promise<AuthUser | null> {
      // Note: This requires admin privileges or a custom function
      // For most cases, use getUserProfile instead
      const profile = getUserProfile ? await getUserProfile(id) : null
      if (!profile) return null

      return {
        id,
        email: '', // Not available without admin access
        name: profile.name,
        role: profile.role,
        organizationId: profile.organizationId,
      }
    },

    isAdmin(user: AuthUser): boolean {
      return user.role ? adminRoles.includes(user.role) : false
    },
  }
}
