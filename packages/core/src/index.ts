// @nextstack/core - Core utilities and configuration

// Auth
export type { AuthUser, AuthAdapter, AuthProvider } from './auth/types'
export { AuthContextProvider, useAuth, useAuthOptional } from './auth/context'

// Config
export { NextstackProvider, useNextstackConfig, usePrisma, useOrganizationId, useMultiTenancy } from './config/provider'
export type { NextstackConfig, MultiTenancyConfig, FeatureFlags } from './config/types'

// Utilities
export { getIpAddress, getUserAgent, getRequestMetadata } from './utils/request'

// Element Picker (re-export core types for convenience)
export type { ElementInfo } from './element-picker/types'
