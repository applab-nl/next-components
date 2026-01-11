/**
 * Represents an authenticated user across all auth providers
 */
export interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
  organizationId?: string
  metadata?: Record<string, unknown>
}

/**
 * Auth adapter interface - implement for each auth provider
 */
export interface AuthAdapter {
  /** Get current authenticated user (returns null if not authenticated) */
  getCurrentUser(): Promise<AuthUser | null>

  /** Sign in with email/password (used by dev-login) */
  signInWithPassword(email: string, password: string): Promise<AuthUser>

  /** Sign out current user */
  signOut(): Promise<void>

  /** Check if user has a specific role */
  hasRole(user: AuthUser, role: string): boolean

  /** Get user by ID (for attribution in audit logs, feedback, etc.) */
  getUserById(id: string): Promise<AuthUser | null>

  /** Check if user is admin */
  isAdmin(user: AuthUser): boolean
}

/**
 * Supported auth providers
 */
export type AuthProvider = 'supabase' | 'clerk' | 'next-auth' | 'custom'
