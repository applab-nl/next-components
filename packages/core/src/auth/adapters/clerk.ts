import type { AuthAdapter, AuthUser } from '../types'

// Clerk types - defined locally to avoid hard dependency
interface ClerkUser {
  id: string
  primaryEmailAddress?: { emailAddress: string }
  firstName?: string | null
  lastName?: string | null
  publicMetadata: Record<string, unknown>
}

export interface ClerkAuthAdapterOptions {
  /** Function to get current Clerk user (from @clerk/nextjs currentUser) */
  getCurrentClerkUser: () => Promise<ClerkUser | null>
  /** Function to sign out (from useClerk().signOut) */
  signOut?: () => Promise<void>
  adminRoles?: string[]
  getOrganizationId?: () => Promise<string | null>
}

/**
 * Create Clerk auth adapter
 *
 * @example
 * ```ts
 * import { currentUser } from '@clerk/nextjs'
 *
 * const auth = createClerkAuthAdapter({
 *   getCurrentClerkUser: currentUser,
 * })
 * ```
 */
export function createClerkAuthAdapter(
  options: ClerkAuthAdapterOptions
): AuthAdapter {
  const {
    getCurrentClerkUser,
    signOut: signOutFn,
    adminRoles = ['admin', 'superadmin'],
    getOrganizationId,
  } = options

  const mapClerkUser = async (user: ClerkUser): Promise<AuthUser> => {
    const role = user.publicMetadata?.role as string | undefined
    const orgId = getOrganizationId ? await getOrganizationId() : null

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? '',
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      role,
      organizationId: orgId ?? undefined,
      metadata: user.publicMetadata,
    }
  }

  return {
    async getCurrentUser(): Promise<AuthUser | null> {
      const user = await getCurrentClerkUser()
      if (!user) return null
      return mapClerkUser(user)
    },

    async signInWithPassword(
      _email: string,
      _password: string
    ): Promise<AuthUser> {
      // Clerk handles sign-in through their UI components
      // This is mainly used for dev-login which should bypass Clerk
      throw new Error(
        'signInWithPassword is not supported with Clerk. Use Clerk UI components for authentication.'
      )
    },

    async signOut(): Promise<void> {
      if (signOutFn) {
        await signOutFn()
      } else {
        throw new Error(
          'signOut must be called from a client component using useClerk().signOut()'
        )
      }
    },

    hasRole(user: AuthUser, role: string): boolean {
      return user.role === role
    },

    async getUserById(_id: string): Promise<AuthUser | null> {
      // Clerk requires backend API for fetching other users
      // This would need clerkClient from @clerk/nextjs/server
      throw new Error(
        'getUserById requires Clerk Backend API. Use clerkClient.users.getUser() directly.'
      )
    },

    isAdmin(user: AuthUser): boolean {
      return user.role ? adminRoles.includes(user.role) : false
    },
  }
}
