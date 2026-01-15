import type { PrismaClient } from '@prisma/client'
import type { AuthAdapter } from '../auth/types'

/**
 * Multi-tenancy configuration
 */
export interface MultiTenancyConfig {
  /** Whether multi-tenancy is enabled */
  enabled: boolean
  /** Function to get current organization ID */
  getOrganizationId: () => Promise<string | null>
}

/**
 * Feature flags for optional packages
 */
export interface FeatureFlags {
  feedback?: boolean
  audit?: boolean
  whatsNew?: boolean
  devtools?: boolean
}

/**
 * Main configuration for @nextdevx packages
 */
export interface NextstackConfig {
  /** Auth adapter instance */
  auth: AuthAdapter
  /** Prisma client instance */
  prisma: PrismaClient
  /** Multi-tenancy configuration */
  multiTenancy: MultiTenancyConfig
  /** Optional feature flags */
  features?: FeatureFlags
}

/**
 * Default multi-tenancy config (disabled)
 */
export const defaultMultiTenancy: MultiTenancyConfig = {
  enabled: false,
  getOrganizationId: async () => null,
}
