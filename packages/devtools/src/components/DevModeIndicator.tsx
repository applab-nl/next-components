'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  User,
  Database,
  Zap,
  GitBranch,
} from 'lucide-react'
import { useAuthOptional } from '@nextstack/core'
import { isLocalhost, getEnvironmentName } from '../utils/environment'

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
  /** Additional CSS classes */
  className?: string
  /** Only show on localhost (default: true) */
  localhostOnly?: boolean
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
  className = '',
  localhostOnly = true,
}: DevModeIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [devInfo, setDevInfo] = useState<DevInfo>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const auth = useAuthOptional()

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

  // Get current user
  useEffect(() => {
    if (!isVisible || !showUser || !auth) return

    auth
      .getCurrentUser()
      .then((user) => setUserEmail(user?.email ?? null))
      .catch(() => setUserEmail(null))
  }, [isVisible, showUser, auth])

  if (!isVisible) return null

  const environment = getEnvironmentName()
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
      {/* Collapsed state - just the indicator dot */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 shadow-lg transition-transform hover:scale-110"
          aria-label="Expand dev info"
        >
          <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-200" />
        </button>
      )}

      {/* Expanded state - full panel */}
      {isExpanded && (
        <div className="w-64 rounded-lg bg-gray-900 p-3 text-sm text-white shadow-xl">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              <span className="font-semibold">Dev Mode</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded p-1 hover:bg-gray-800"
              aria-label="Collapse dev info"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Info rows */}
          <div className="space-y-2 text-gray-300">
            {/* Git Branch */}
            {showGitBranch && devInfo.branch && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="truncate">{devInfo.branch}</span>
              </div>
            )}

            {/* Database */}
            {showDatabase && (
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="truncate">
                  {databaseId ?? devInfo.database ?? 'Local'}
                  {(databasePort ?? devInfo.databasePort) && (
                    <span className="ml-1 text-gray-500">
                      :{databasePort ?? devInfo.databasePort}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* User */}
            {showUser && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="truncate">
                  {userEmail ?? 'Not logged in'}
                </span>
              </div>
            )}

            {/* Environment badge */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  environment === 'production'
                    ? 'bg-red-900 text-red-200'
                    : environment === 'staging'
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-green-900 text-green-200'
                }`}
              >
                {environment}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

DevModeIndicator.displayName = 'DevModeIndicator'
