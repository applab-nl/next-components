/**
 * Icon names from lucide-react
 */
export type IconName =
  | 'shield'
  | 'user'
  | 'users'
  | 'eye'
  | 'edit'
  | 'crown'
  | 'star'
  | 'activity'
  | 'settings'
  | 'database'
  | 'code'
  | 'globe'

/**
 * Badge color options
 */
export type BadgeColor =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'gray'
  | 'yellow'
  | 'pink'

/**
 * Test user configuration
 */
export interface TestUser {
  /** Unique identifier for the test user */
  id: string
  /** Email address (used for login) */
  email: string
  /** Password (used for login) */
  password: string
  /** Display name */
  name: string
  /** User role (e.g., 'admin', 'user', 'viewer') */
  role?: string
  /** Lucide icon name */
  icon?: IconName
  /** Badge color */
  color?: BadgeColor
  /** Category for grouping in UI */
  category?: string
  /** Short description of the user */
  description?: string
  /** Additional metadata displayed in UI */
  metadata?: Record<string, string>
}

/**
 * Category configuration for grouping test users
 */
export interface TestUserCategory {
  name: string
  description?: string
}

/**
 * Define test users for dev-login page
 *
 * @example
 * ```ts
 * export const testUsers = defineTestUsers([
 *   {
 *     id: 'admin',
 *     email: 'admin@test.local',
 *     password: 'test123',
 *     name: 'Admin User',
 *     role: 'admin',
 *     icon: 'shield',
 *     color: 'purple',
 *     category: 'Admins',
 *     description: 'Full access to all features'
 *   }
 * ])
 * ```
 */
export function defineTestUsers(users: TestUser[]): TestUser[] {
  return users.map((user) => ({
    icon: 'user',
    color: 'gray',
    ...user,
  }))
}

/**
 * Group test users by category
 */
export function groupUsersByCategory(
  users: TestUser[]
): Map<string, TestUser[]> {
  const groups = new Map<string, TestUser[]>()

  for (const user of users) {
    const category = user.category ?? 'Other'
    const existing = groups.get(category) ?? []
    groups.set(category, [...existing, user])
  }

  return groups
}
