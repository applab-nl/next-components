'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  User,
  Users,
  Eye,
  Edit,
  Crown,
  Star,
  Activity,
  Settings,
  Database,
  Code,
  Globe,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@nextstack/core'
import type { TestUser, IconName, BadgeColor } from '../config/test-users'
import { groupUsersByCategory } from '../config/test-users'
import { isLocalhost } from '../utils/environment'

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  user: User,
  users: Users,
  eye: Eye,
  edit: Edit,
  crown: Crown,
  star: Star,
  activity: Activity,
  settings: Settings,
  database: Database,
  code: Code,
  globe: Globe,
}

const colorClasses: Record<BadgeColor, string> = {
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
}

export interface DevLoginPageProps {
  /** Test users to display */
  users: TestUser[]
  /** URL to redirect to after login */
  redirectTo?: string
  /** Show custom email/password form */
  showCustomLogin?: boolean
  /** Page title */
  title?: string
  /** Page subtitle */
  subtitle?: string
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * Development-only login page for quick access to test accounts
 *
 * Only accessible on localhost for security.
 */
export function DevLoginPage({
  users,
  redirectTo = '/dashboard',
  showCustomLogin = true,
  title = 'Development Login',
  subtitle = 'Quick access to test accounts',
  className = '',
}: DevLoginPageProps) {
  const router = useRouter()
  const auth = useAuth()

  const [isAllowed, setIsAllowed] = useState(false)
  const [loggingInUser, setLoggingInUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Custom login form state
  const [customEmail, setCustomEmail] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [isCustomLoading, setIsCustomLoading] = useState(false)

  // Check if on localhost
  useEffect(() => {
    setIsAllowed(isLocalhost())
  }, [])

  const handleLogin = async (user: TestUser) => {
    setError(null)
    setLoggingInUser(user.id)

    try {
      await auth.signInWithPassword(user.email, user.password)
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoggingInUser(null)
    }
  }

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsCustomLoading(true)

    try {
      await auth.signInWithPassword(customEmail, customPassword)
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsCustomLoading(false)
    }
  }

  // Not allowed on non-localhost
  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Dev login is only available on localhost
          </p>
        </div>
      </div>
    )
  }

  const groupedUsers = groupUsersByCategory(users)

  return (
    <div
      className={`min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900 ${className}`}
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Development Mode
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/50 dark:text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Test users by category */}
        {Array.from(groupedUsers.entries()).map(([category, categoryUsers]) => (
          <div key={category} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {category}
            </h2>
            <div className="space-y-2">
              {categoryUsers.map((user) => {
                const Icon = iconMap[user.icon ?? 'user']
                const isLoading = loggingInUser === user.id

                return (
                  <button
                    key={user.id}
                    onClick={() => handleLogin(user)}
                    disabled={isLoading || loggingInUser !== null}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                        {user.description && (
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {user.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses[user.color ?? 'gray']}`}
                        >
                          {user.role}
                        </span>
                      )}
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Custom login form */}
        {showCustomLogin && (
          <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Custom Login
            </h2>
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isCustomLoading || loggingInUser !== null}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCustomLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

DevLoginPage.displayName = 'DevLoginPage'
