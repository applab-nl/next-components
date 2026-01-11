'use client'

import { useContext } from 'react'
import { ThemeContext } from '../providers/ThemeProvider'
import type { ThemeContextValue } from '../types'

/**
 * Hook to access theme context
 *
 * @example
 * ```tsx
 * const { theme, resolvedTheme, setTheme } = useTheme()
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
