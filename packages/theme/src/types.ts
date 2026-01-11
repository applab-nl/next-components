export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeProviderProps {
  children: React.ReactNode
  /** Default theme (default: 'system') */
  defaultTheme?: Theme
  /** localStorage key (default: 'nextstack-theme') */
  storageKey?: string
  /** Enable system theme option (default: true) */
  enableSystemTheme?: boolean
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void
  /** Initial theme from server (e.g., from user profile) */
  initialTheme?: Theme
}

export interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}
