'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, User, Database, Zap, GitBranch } from 'lucide-react'
import { useAuthOptional } from '@nextstack/core'
import { isLocalhost, getEnvironmentName } from '../utils/environment'

export interface DevModeIndicatorTranslations {
  badge?: string
  auth?: string
  notAuthenticated?: string
  database?: string
  environment?: string
  branch?: string
  userId?: string
}

const defaultTranslations: Required<DevModeIndicatorTranslations> = {
  badge: 'DEV',
  auth: 'Auth',
  notAuthenticated: 'Not authenticated',
  database: 'Database',
  environment: 'Environment',
  branch: 'Branch',
  userId: 'ID: {id}',
}

export interface DevModeIndicatorProps {
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Show git branch info */
  showGitBranch?: boolean
  /** Show database info */
  showDatabase?: boolean
  /** Show current user */
  showUser?: boolean
  /** API endpoint for dev info (default: /api/dev/info) */
  devInfoEndpoint?: string
  /** Database identifier to display */
  databaseId?: string
  /** Database port to display */
  databasePort?: number | string
  /** User email to display (overrides auth context) */
  userEmail?: string | null
  /** User ID to display (overrides auth context) */
  userId?: string | null
  /** Additional CSS classes */
  className?: string
  /** Only show on localhost (default: true) */
  localhostOnly?: boolean
  /** Custom translations (for apps without next-intl) */
  translations?: DevModeIndicatorTranslations
  /** Translation function from next-intl useTranslations('devMode') */
  t?: (key: string, values?: Record<string, string>) => string
}

interface DevInfo {
  branch?: string
  database?: string
  databasePort?: number | string
}

/**
 * Floating development mode indicator
 *
 * Displays current git branch, database, user, and environment.
 * Only visible in development mode by default.
 */
export function DevModeIndicator({
  position = 'bottom-right',
  showGitBranch = true,
  showDatabase = true,
  showUser = true,
  devInfoEndpoint = '/api/dev/info',
  databaseId,
  databasePort,
  userEmail: userEmailProp,
  userId: userIdProp,
  className = '',
  localhostOnly = true,
  translations,
  t: translateFn,
}: DevModeIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [devInfo, setDevInfo] = useState<DevInfo>({})
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const auth = useAuthOptional()

  // Use props if provided, otherwise use auth context
  const userEmail = userEmailProp !== undefined ? userEmailProp : authUserEmail
  const userId = userIdProp !== undefined ? userIdProp : authUserId

  // Merge translations with defaults
  const labels = { ...defaultTranslations, ...translations }

  // Translation helper - uses provided t function or falls back to labels
  const translate = (key: keyof typeof defaultTranslations, values?: Record<string, string>) => {
    if (translateFn) {
      return translateFn(key, values)
    }
    let text = labels[key]
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v)
      })
    }
    return text
  }

  // Check visibility
  useEffect(() => {
    if (localhostOnly && !isLocalhost()) {
      setIsVisible(false)
      return
    }
    setIsVisible(true)
  }, [localhostOnly])

  // Fetch dev info (git branch, etc.)
  useEffect(() => {
    if (!isVisible || !showGitBranch) return

    fetch(devInfoEndpoint)
      .then((res) => res.json())
      .then((data) => setDevInfo(data))
      .catch(() => setDevInfo({ branch: 'unknown' }))
  }, [isVisible, showGitBranch, devInfoEndpoint])

  // Get current user from auth context (only if props not provided)
  useEffect(() => {
    if (!isVisible || !showUser || !auth) return
    if (userEmailProp !== undefined) return // Skip if prop provided

    auth
      .getCurrentUser()
      .then((user) => {
        setAuthUserEmail(user?.email ?? null)
        setAuthUserId(user?.id ?? null)
      })
      .catch(() => {
        setAuthUserEmail(null)
        setAuthUserId(null)
      })
  }, [isVisible, showUser, auth, userEmailProp])

  if (!isVisible) return null

  const environment = getEnvironmentName()
  const branch = devInfo.branch
  const dbName = databaseId ?? devInfo.database ?? 'Local'
  const dbPort = databasePort ?? devInfo.databasePort

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
      role="status"
      aria-label="Development mode indicator"
    >
      <div
        className={`bg-gray-900 text-white rounded-lg shadow-lg transition-all duration-200 ${
          isExpanded ? 'w-72' : 'w-auto'
        }`}
      >
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 w-full text-left"
          aria-label={isExpanded ? 'Collapse dev info' : 'Expand dev info'}
        >
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-medium">
            {translate('badge')}
            {showGitBranch && branch && (
              <span className="text-orange-400 ml-1">(⎇ {branch})</span>
            )}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 ml-auto" />
          ) : (
            <ChevronUp className="h-3 w-3 ml-auto" />
          )}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-gray-700">
            {/* Auth Status */}
            {showUser && (
              <div className="flex items-start gap-2 pt-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{translate('auth')}</p>
                  {userEmail ? (
                    <p className="text-xs text-green-400 truncate">{userEmail}</p>
                  ) : (
                    <p className="text-xs text-yellow-400">{translate('notAuthenticated')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Database */}
            {showDatabase && (
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{translate('database')}</p>
                  <p className="text-xs text-blue-400">
                    {dbName}
                    {dbPort && <span className="text-gray-500">:{dbPort}</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Environment */}
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{translate('environment')}</p>
                <p className="text-xs text-purple-400 capitalize">{environment}</p>
              </div>
            </div>

            {/* Git Branch - detailed view */}
            {showGitBranch && branch && (
              <div className="flex items-start gap-2">
                <GitBranch className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{translate('branch')}</p>
                  <p className="text-xs text-orange-400 truncate">{branch}</p>
                </div>
              </div>
            )}

            {/* User ID */}
            {showUser && userId && (
              <div className="pt-1 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  {translate('userId', { id: userId.substring(0, 8) + '...' })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

DevModeIndicator.displayName = 'DevModeIndicator'
