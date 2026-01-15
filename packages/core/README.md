# @nextdevx/core

Core utilities, authentication adapters, and configuration for the @nextdevx package ecosystem.

## Features

- **Unified Auth Adapters** - Consistent authentication interface for Supabase, Clerk, and NextAuth.js
- **Configuration Provider** - Centralized configuration management for all @nextdevx packages
- **Multi-Tenancy Support** - Built-in organization-based data isolation
- **Element Picker** - Interactive DOM element selection with CSS selector and XPath generation
- **Request Utilities** - IP address and user agent extraction helpers

## Installation

```bash
npm install @nextdevx/core
# or
pnpm add @nextdevx/core
# or
yarn add @nextdevx/core
```

## Quick Start

### 1. Create an Auth Adapter

Choose the adapter for your authentication provider:

```typescript
// Supabase
import { createSupabaseAuthAdapter } from '@nextdevx/core/auth/supabase'

const authAdapter = createSupabaseAuthAdapter({
  client: supabaseClient,
  adminRoles: ['admin', 'superadmin'],
  getUserProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, role, organization_id')
      .eq('id', userId)
      .single()
    return data ? {
      name: data.name,
      role: data.role,
      organizationId: data.organization_id,
    } : null
  },
})
```

```typescript
// Clerk
import { createClerkAuthAdapter } from '@nextdevx/core/auth/clerk'

const authAdapter = createClerkAuthAdapter({
  adminRoles: ['org:admin'],
})
```

```typescript
// NextAuth.js
import { createNextAuthAdapter } from '@nextdevx/core/auth/next-auth'

const authAdapter = createNextAuthAdapter({
  adminRoles: ['admin'],
})
```

### 2. Configure the Provider

Wrap your application with `NextstackProvider`:

```tsx
// app/providers.tsx
'use client'

import { NextstackProvider } from '@nextdevx/core'
import { createSupabaseAuthAdapter } from '@nextdevx/core/auth/supabase'

export function Providers({ children }: { children: React.ReactNode }) {
  const authAdapter = createSupabaseAuthAdapter({
    client: supabaseClient,
  })

  return (
    <NextstackProvider
      config={{
        auth: authAdapter,
        prisma: prismaClient,
        multiTenancy: {
          enabled: true,
          getOrganizationId: async () => {
            const user = await authAdapter.getCurrentUser()
            return user?.organizationId ?? null
          },
        },
        features: {
          feedback: true,
          audit: true,
          whatsNew: true,
        },
      }}
    >
      {children}
    </NextstackProvider>
  )
}
```

### 3. Use the Hooks

```tsx
import { useAuth, useNextstackConfig, usePrisma, useOrganizationId } from '@nextdevx/core'

function MyComponent() {
  // Get current authenticated user (throws if not in AuthContextProvider)
  const user = useAuth()

  // Get full configuration
  const config = useNextstackConfig()

  // Get Prisma client
  const prisma = usePrisma()

  // Get current organization ID (for multi-tenancy)
  const orgId = useOrganizationId()

  return <div>Welcome, {user.name}!</div>
}
```

## API Reference

### Auth Types

#### `AuthUser`

Represents an authenticated user across all auth providers.

```typescript
interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
  organizationId?: string
  metadata?: Record<string, unknown>
}
```

#### `AuthAdapter`

Interface that all auth adapters must implement.

```typescript
interface AuthAdapter {
  /** Get current authenticated user (returns null if not authenticated) */
  getCurrentUser(): Promise<AuthUser | null>

  /** Sign in with email/password (used by dev-login) */
  signInWithPassword(email: string, password: string): Promise<AuthUser>

  /** Sign out current user */
  signOut(): Promise<void>

  /** Check if user has a specific role */
  hasRole(user: AuthUser, role: string): boolean

  /** Get user by ID (for attribution in audit logs, feedback, etc.) */
  getUserById(id: string): Promise<AuthUser | null>

  /** Check if user is admin */
  isAdmin(user: AuthUser): boolean
}
```

### Configuration Types

#### `NextstackConfig`

Main configuration object for @nextdevx packages.

```typescript
interface NextstackConfig {
  /** Auth adapter instance */
  auth: AuthAdapter
  /** Prisma client instance */
  prisma: PrismaClient
  /** Multi-tenancy configuration */
  multiTenancy: MultiTenancyConfig
  /** Optional feature flags */
  features?: FeatureFlags
}
```

#### `MultiTenancyConfig`

```typescript
interface MultiTenancyConfig {
  /** Whether multi-tenancy is enabled */
  enabled: boolean
  /** Function to get current organization ID */
  getOrganizationId: () => Promise<string | null>
}
```

#### `FeatureFlags`

```typescript
interface FeatureFlags {
  feedback?: boolean
  audit?: boolean
  whatsNew?: boolean
  devtools?: boolean
}
```

### Auth Adapters

#### Supabase Adapter

```typescript
import { createSupabaseAuthAdapter } from '@nextdevx/core/auth/supabase'

interface SupabaseAuthAdapterOptions {
  client: SupabaseClient
  adminRoles?: string[]  // Default: ['admin', 'superadmin']
  getUserProfile?: (userId: string) => Promise<{
    name?: string
    role?: string
    organizationId?: string
  } | null>
}

const adapter = createSupabaseAuthAdapter(options)
```

#### Clerk Adapter

```typescript
import { createClerkAuthAdapter } from '@nextdevx/core/auth/clerk'

interface ClerkAuthAdapterOptions {
  adminRoles?: string[]  // Default: ['org:admin']
}

const adapter = createClerkAuthAdapter(options)
```

#### NextAuth.js Adapter

```typescript
import { createNextAuthAdapter } from '@nextdevx/core/auth/next-auth'

interface NextAuthAdapterOptions {
  adminRoles?: string[]  // Default: ['admin']
}

const adapter = createNextAuthAdapter(options)
```

### Hooks

#### `useAuth()`

Get the current authenticated user. Throws an error if used outside of `AuthContextProvider` or if the user is not authenticated.

```typescript
const user = useAuth()
// user is guaranteed to be AuthUser (not null)
```

#### `useAuthOptional()`

Get the current authenticated user, or `null` if not authenticated. Safe to use in components that may render without authentication.

```typescript
const user = useAuthOptional()
// user is AuthUser | null
```

#### `useNextstackConfig()`

Access the full configuration object.

```typescript
const config = useNextstackConfig()
// config.auth, config.prisma, config.multiTenancy, config.features
```

#### `usePrisma()`

Get the Prisma client instance from configuration.

```typescript
const prisma = usePrisma()
const users = await prisma.user.findMany()
```

#### `useOrganizationId()`

Get the current organization ID for multi-tenancy filtering. Returns `null` if multi-tenancy is disabled.

```typescript
const orgId = useOrganizationId()
```

#### `useMultiTenancy()`

Check if multi-tenancy is enabled.

```typescript
const isMultiTenant = useMultiTenancy()
```

### Element Picker

Interactive component for selecting DOM elements and generating selectors.

```typescript
import { ElementPicker } from '@nextdevx/core/element-picker'

interface ElementPickerProps {
  /** Whether the picker is active */
  isOpen: boolean
  /** Callback when an element is selected */
  onSelect: (elementInfo: ElementInfo) => void
  /** Callback when selection is cancelled */
  onCancel: () => void
  /** Custom instruction text */
  instructionText?: string
  /** Data attribute for excluding picker elements */
  excludeAttribute?: string  // Default: 'data-element-picker'
}

interface ElementInfo {
  /** Human-readable element name */
  friendlyName: string
  /** CSS selector for the element */
  cssSelector: string
  /** XPath to the element */
  xpath: string
  /** HTML tag name (lowercase) */
  tagName: string
}
```

#### Element Picker Usage

```tsx
import { useState } from 'react'
import { ElementPicker } from '@nextdevx/core/element-picker'
import type { ElementInfo } from '@nextdevx/core'

function MyComponent() {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)

  return (
    <>
      <button onClick={() => setIsPickerOpen(true)}>
        Select Element
      </button>

      <ElementPicker
        isOpen={isPickerOpen}
        onSelect={(elementInfo) => {
          setSelectedElement(elementInfo)
          setIsPickerOpen(false)
          console.log('Selected:', elementInfo.friendlyName)
          console.log('CSS Selector:', elementInfo.cssSelector)
        }}
        onCancel={() => setIsPickerOpen(false)}
        instructionText="Click an element to select it"
      />

      {selectedElement && (
        <div>
          <p>Selected: {selectedElement.friendlyName}</p>
          <code>{selectedElement.cssSelector}</code>
        </div>
      )}
    </>
  )
}
```

#### Element Picker Utilities

```typescript
import {
  getElementInfo,
  generateCssSelector,
  generateXPath,
  generateFriendlyName,
  getElementLabel,
  findElementBySelector,
  shouldExcludeElement,
  getElementBounds,
  isTailwindClass,
  filterTailwindClasses,
  clearNameCaches,
  getNameGenerationMetrics,
  resetNameGenerationMetrics,
} from '@nextdevx/core/element-picker'

// Get complete element information
const info = getElementInfo(element)

// Generate individual selectors
const cssSelector = generateCssSelector(element)
const xpath = generateXPath(element)
const friendlyName = generateFriendlyName(element)

// Find element by selector
const element = findElementBySelector(cssSelector)

// Check if element should be excluded from picker
const shouldExclude = shouldExcludeElement(element, 'data-element-picker')

// Get element bounding rect
const bounds = getElementBounds(element)

// Tailwind class utilities
const isTailwind = isTailwindClass('text-blue-500')  // true
const filteredClasses = filterTailwindClasses(['text-blue-500', 'my-custom-class'])
```

### Request Utilities

Helpers for extracting request metadata (useful for audit logging).

```typescript
import { getIpAddress, getUserAgent, getRequestMetadata } from '@nextdevx/core'

// In a Next.js API route or Server Action
export async function POST(request: Request) {
  const ip = getIpAddress(request.headers)
  const userAgent = getUserAgent(request.headers)

  // Or get both at once
  const { ipAddress, userAgent } = getRequestMetadata(request.headers)

  // Use for audit logging, rate limiting, etc.
}
```

## Creating a Custom Auth Adapter

If you're using a custom authentication solution, implement the `AuthAdapter` interface:

```typescript
import type { AuthAdapter, AuthUser } from '@nextdevx/core'

export function createCustomAuthAdapter(): AuthAdapter {
  return {
    async getCurrentUser(): Promise<AuthUser | null> {
      // Your implementation
      const session = await getSession()
      if (!session) return null

      return {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      }
    },

    async signInWithPassword(email: string, password: string): Promise<AuthUser> {
      // Your implementation
      const user = await authenticate(email, password)
      return user
    },

    async signOut(): Promise<void> {
      // Your implementation
      await clearSession()
    },

    hasRole(user: AuthUser, role: string): boolean {
      return user.role === role
    },

    async getUserById(id: string): Promise<AuthUser | null> {
      // Your implementation
      const user = await fetchUser(id)
      return user
    },

    isAdmin(user: AuthUser): boolean {
      return user.role === 'admin'
    },
  }
}
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `react` | >=18.0.0 | Yes |
| `react-dom` | >=18.0.0 | Yes |
| `@prisma/client` | >=5.0.0 | Yes |
| `lucide-react` | >=0.300.0 | Optional |
| `@supabase/supabase-js` | * | Optional (for Supabase adapter) |
| `@clerk/nextjs` | * | Optional (for Clerk adapter) |
| `next-auth` | * | Optional (for NextAuth adapter) |

## TypeScript

This package is written in TypeScript and includes full type definitions. All exports are fully typed.

```typescript
import type {
  AuthUser,
  AuthAdapter,
  AuthProvider,
  NextstackConfig,
  MultiTenancyConfig,
  FeatureFlags,
  ElementInfo,
  ElementPickerProps,
  HighlightPosition,
  TooltipPosition,
} from '@nextdevx/core'
```

## License

MIT
