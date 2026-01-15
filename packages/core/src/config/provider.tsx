'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { AuthContextProvider } from '../auth/context'
import type { NextstackConfig } from './types'
import { defaultMultiTenancy } from './types'

const NextstackContext = createContext<NextstackConfig | null>(null)

export interface NextstackProviderProps {
  config: Omit<NextstackConfig, 'multiTenancy'> & {
    multiTenancy?: Partial<NextstackConfig['multiTenancy']>
  }
  children: ReactNode
}

/**
 * Provider for @nextdevx configuration
 *
 * @example
 * ```tsx
 * <NextstackProvider
 *   config={{
 *     auth: createSupabaseAuthAdapter({ client: supabase }),
 *     prisma,
 *     multiTenancy: {
 *       enabled: true,
 *       getOrganizationId: async () => user?.organizationId ?? null
 *     }
 *   }}
 * >
 *   <App />
 * </NextstackProvider>
 * ```
 */
export function NextstackProvider({ config, children }: NextstackProviderProps) {
  const fullConfig: NextstackConfig = {
    ...config,
    multiTenancy: {
      ...defaultMultiTenancy,
      ...config.multiTenancy,
    },
  }

  return (
    <NextstackContext.Provider value={fullConfig}>
      <AuthContextProvider value={fullConfig.auth}>{children}</AuthContextProvider>
    </NextstackContext.Provider>
  )
}

/**
 * Hook to access @nextdevx configuration
 */
export function useNextstackConfig(): NextstackConfig {
  const config = useContext(NextstackContext)
  if (!config) {
    throw new Error('useNextstackConfig must be used within a NextstackProvider')
  }
  return config
}

/**
 * Hook to access Prisma client from config
 */
export function usePrisma(): NextstackConfig['prisma'] {
  const config = useNextstackConfig()
  return config.prisma
}

/**
 * Hook to get organization ID if multi-tenancy is enabled
 */
export function useOrganizationId(): () => Promise<string | null> {
  const config = useNextstackConfig()
  return config.multiTenancy.getOrganizationId
}

/**
 * Hook to check if multi-tenancy is enabled
 */
export function useMultiTenancy(): boolean {
  const config = useNextstackConfig()
  return config.multiTenancy.enabled
}
