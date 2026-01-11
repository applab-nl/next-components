'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../types'

export interface ProfileThemeSyncProps {
  /**
   * Current user object. When null/undefined, sync is disabled.
   * Only needs an id field to detect login/logout.
   */
  user: { id: string } | null | undefined

  /**
   * User's theme preference from their profile.
   * Should be fetched from your user/profile API.
   */
  profileTheme: Theme | null | undefined

  /**
   * Callback to update theme in user profile.
   * Called when user changes theme while logged in.
   */
  onProfileThemeUpdate: (theme: Theme) => void

  /**
   * Whether profile data has been loaded.
   * Prevents premature syncing before profile is available.
   * @default true
   */
  isProfileLoaded?: boolean
}

/**
 * Component that syncs theme preference with user profile.
 *
 * Must be placed inside ThemeProvider. Handles bidirectional sync:
 * - On login: syncs profile theme → local state
 * - On theme change: updates profile (if logged in)
 *
 * @example
 * ```tsx
 * // With React Query
 * function MyProfileThemeSync() {
 *   const { user } = useAuth()
 *   const { data: profile, isSuccess } = useProfile()
 *   const updateTheme = useUpdateThemeMutation()
 *
 *   return (
 *     <ProfileThemeSync
 *       user={user}
 *       profileTheme={profile?.themePreference}
 *       onProfileThemeUpdate={(theme) => updateTheme.mutate(theme)}
 *       isProfileLoaded={isSuccess}
 *     />
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With fetch
 * function MyProfileThemeSync() {
 *   const { user } = useAuth()
 *   const [profile, setProfile] = useState(null)
 *   const [loaded, setLoaded] = useState(false)
 *
 *   useEffect(() => {
 *     if (user) {
 *       fetch('/api/profile').then(r => r.json()).then(p => {
 *         setProfile(p)
 *         setLoaded(true)
 *       })
 *     }
 *   }, [user])
 *
 *   const updateTheme = (theme: Theme) => {
 *     fetch('/api/profile/theme', {
 *       method: 'PATCH',
 *       body: JSON.stringify({ theme })
 *     })
 *   }
 *
 *   return (
 *     <ProfileThemeSync
 *       user={user}
 *       profileTheme={profile?.themePreference}
 *       onProfileThemeUpdate={updateTheme}
 *       isProfileLoaded={loaded}
 *     />
 *   )
 * }
 * ```
 */
export function ProfileThemeSync({
  user,
  profileTheme,
  onProfileThemeUpdate,
  isProfileLoaded = true,
}: ProfileThemeSyncProps) {
  const { theme, setTheme } = useTheme()
  const hasInitialSynced = useRef(false)
  const previousTheme = useRef<Theme>(theme)
  const previousUserId = useRef<string | null>(null)

  // On login: sync profile theme → local state
  useEffect(() => {
    const userId = user?.id ?? null

    // Detect login (user changed from null to a user, or to a different user)
    const isNewLogin = userId && userId !== previousUserId.current

    if (isNewLogin && isProfileLoaded && !hasInitialSynced.current) {
      // User just logged in and profile is loaded
      if (profileTheme && profileTheme !== theme) {
        setTheme(profileTheme)
      }
      hasInitialSynced.current = true
    }

    // Reset sync flag on logout
    if (!userId && previousUserId.current) {
      hasInitialSynced.current = false
    }

    previousUserId.current = userId
  }, [user, profileTheme, isProfileLoaded, theme, setTheme])

  // On theme change: update profile (if logged in)
  useEffect(() => {
    if (user && hasInitialSynced.current && theme !== previousTheme.current) {
      onProfileThemeUpdate(theme)
    }
    previousTheme.current = theme
  }, [theme, user, onProfileThemeUpdate])

  return null
}

ProfileThemeSync.displayName = 'ProfileThemeSync'
