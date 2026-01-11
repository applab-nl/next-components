import type { AuthAdapter, AuthUser } from '../types'

// NextAuth types
interface NextAuthSession {
  user?: {
    id?: string
    email?: string | null
    name?: string | null
    image?: string | null
    role?: string
  }
}

export interface NextAuthAdapterOptions {
  getSession: () => Promise<NextAuthSession | null>
  signIn?: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  adminRoles?: string[]
  getOrganizationId?: (userId: string) => Promise<string | null>
  getUserById?: (id: string) => Promise<AuthUser | null>
}

export function createNextAuthAdapter(
  options: NextAuthAdapterOptions
): AuthAdapter {
  const {
    getSession,
    signIn,
    signOut,
    adminRoles = ['admin', 'superadmin'],
    getOrganizationId,
    getUserById,
  } = options

  return {
    async getCurrentUser(): Promise<AuthUser | null> {
      const session = await getSession()
      if (!session?.user?.id) return null

      const orgId = getOrganizationId
        ? await getOrganizationId(session.user.id)
        : null

      return {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.name ?? undefined,
        role: session.user.role,
        organizationId: orgId ?? undefined,
      }
    },

    async signInWithPassword(
      email: string,
      password: string
    ): Promise<AuthUser> {
      if (!signIn) {
        throw new Error(
          'signInWithPassword requires a signIn function in NextAuthAdapterOptions'
        )
      }
      await signIn(email, password)

      // After sign in, get the user
      const user = await this.getCurrentUser()
      if (!user) throw new Error('Failed to get user after sign in')
      return user
    },

    async signOut(): Promise<void> {
      await signOut()
    },

    hasRole(user: AuthUser, role: string): boolean {
      return user.role === role
    },

    async getUserById(id: string): Promise<AuthUser | null> {
      if (getUserById) {
        return getUserById(id)
      }
      // Default implementation - return minimal info
      return null
    },

    isAdmin(user: AuthUser): boolean {
      return user.role ? adminRoles.includes(user.role) : false
    },
  }
}
