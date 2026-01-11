'use client'

import {
  createContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { Theme, ResolvedTheme, ThemeContextValue, ThemeProviderProps } from '../types'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Theme provider with light/dark/system support
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="system">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'nextstack-theme',
  enableSystemTheme = true,
  onThemeChange,
  initialTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Use initial theme if provided (e.g., from user profile)
    if (initialTheme) return initialTheme
    // Otherwise use default
    return defaultTheme
  })
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored)
    } else if (initialTheme) {
      setThemeState(initialTheme)
    }
    setMounted(true)
  }, [storageKey, initialTheme])

  // Resolve theme and apply to document
  useEffect(() => {
    if (!mounted) return

    const resolved: ResolvedTheme =
      theme === 'system' ? getSystemTheme() : theme

    setResolvedTheme(resolved)

    // Apply to document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolved)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      // Validate system theme
      if (newTheme === 'system' && !enableSystemTheme) {
        newTheme = 'light'
      }

      setThemeState(newTheme)
      localStorage.setItem(storageKey, newTheme)
      onThemeChange?.(newTheme)
    },
    [storageKey, enableSystemTheme, onThemeChange]
  )

  // Prevent flash during hydration
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{ theme: defaultTheme, resolvedTheme: 'light', setTheme }}
      >
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

ThemeProvider.displayName = 'ThemeProvider'
