'use client'

import { createContext, useContext } from 'react'
import type { AuthAdapter } from './types'

const AuthContext = createContext<AuthAdapter | null>(null)

/**
 * Provider component for auth context
 */
export const AuthContextProvider = AuthContext.Provider

export function useAuth(): AuthAdapter {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return auth
}

export function useAuthOptional(): AuthAdapter | null {
  return useContext(AuthContext)
}
