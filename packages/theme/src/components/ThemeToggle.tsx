'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../types'

export interface ThemeToggleProps {
  /** Toggle variant */
  variant?: 'icon' | 'dropdown'
  /** Show system theme option */
  showSystemOption?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Theme toggle button
 *
 * Cycles through: light → dark → system → light
 */
export function ThemeToggle({
  variant = 'icon',
  showSystemOption = true,
  className = '',
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const themes: Theme[] = showSystemOption
      ? ['light', 'dark', 'system']
      : ['light', 'dark']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex]!)
  }

  const Icon =
    theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  const label =
    theme === 'light'
      ? 'Light mode'
      : theme === 'dark'
        ? 'Dark mode'
        : 'System theme'

  if (variant === 'icon') {
    return (
      <button
        onClick={cycleTheme}
        className={`rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${className}`}
        aria-label={`Current: ${label}. Click to change.`}
        title={label}
      >
        <Icon className="h-5 w-5" />
      </button>
    )
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={cycleTheme}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </button>
    </div>
  )
}

ThemeToggle.displayName = 'ThemeToggle'
