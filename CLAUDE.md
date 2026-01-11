# @nextstack Monorepo

Reusable Next.js components and utilities extracted from production projects.

## Project Overview

This is a pnpm monorepo containing publishable packages under the `@nextstack` scope. Packages are consumed via git dependencies, not npm.

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `@nextstack/core` | `packages/core` | Auth adapters, Prisma utilities, config provider |
| `@nextstack/devtools` | `packages/devtools` | Dev mode indicator, dev-login page |
| `@nextstack/feedback` | `packages/feedback` | Feedback system with element picker, screenshots, voting |
| `@nextstack/whats-new` | `packages/whats-new` | Changelog with voting and feedback linking |
| `@nextstack/theme` | `packages/theme` | Theme provider with light/dark/system modes |
| `@nextstack/audit` | `packages/audit` | Audit logging with admin viewer |
| `@nextstack/cli` | `packages/cli` | CLI for package setup and migrations |

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Framework**: Next.js 16+ (App Router)
- **Database**: Prisma ORM (PostgreSQL)
- **Auth**: Adapter pattern supporting Supabase, Clerk, NextAuth
- **Styling**: Tailwind CSS (shadcn pattern - copy source)
- **i18n**: next-intl (built-in translations)
- **State**: Framework-agnostic services (consumers wrap with React Query/SWR)

## Architecture Decisions

### Auth Adapter Pattern
All packages use a pluggable auth interface. Never import auth directly - use the adapter from context:
```typescript
// Good
const auth = useAuth() // from @nextstack/core
const user = await auth.getCurrentUser()

// Bad - don't do this
import { supabase } from '@/lib/supabase'
```

### Multi-Tenancy
Multi-tenancy is configurable via `NextstackProvider`. When enabled, all queries should include `organizationId`:
```typescript
const config = useNextstackConfig()
if (config.multiTenancy.enabled) {
  const orgId = await config.multiTenancy.getOrganizationId()
  // Include orgId in queries
}
```

### Database Layer
- Use Prisma for all database operations
- Each package has its own schema file in `packages/{name}/prisma/schema.prisma`
- Consumers merge schemas using Prisma's multi-file schema feature
- Never use raw SQL except in migrations

### i18n
- All user-facing strings must use next-intl
- Translation keys live in `packages/{name}/src/i18n/messages.ts`
- Export default English translations that consumers merge into their setup

### Styling
- Use Tailwind CSS with the shadcn pattern (copy source, full control)
- Components should work with any Tailwind config
- Use CSS variables for colors that need theming: `bg-background`, `text-foreground`
- Support dark mode via `dark:` prefix classes

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm --filter @nextstack/devtools build

# Run dev mode (watch)
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Test
pnpm test
```

## Creating a New Package

1. Create directory: `packages/{name}/`
2. Add `package.json` with name `@nextstack/{name}`
3. Add to `pnpm-workspace.yaml` if not using glob
4. Create `src/index.ts` as entry point
5. Add `tsconfig.json` extending root config
6. If package has DB models, create `prisma/schema.prisma`

## Code Patterns

### Service Pattern (Framework-Agnostic)
```typescript
// Define interface
export interface FeedbackService {
  submit(input: FeedbackInput): Promise<Feedback>
  getAll(): Promise<Feedback[]>
}

// Factory function
export function createFeedbackService(
  prisma: PrismaClient,
  auth: AuthAdapter
): FeedbackService {
  return {
    async submit(input) {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')
      return prisma.feedback.create({ data: { ...input, userId: user.id } })
    },
    // ...
  }
}
```

### Component Pattern
```typescript
// Props interface with sensible defaults
interface DevModeIndicatorProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showGitBranch?: boolean
  showDatabase?: boolean
  className?: string
}

// Export component with displayName
export function DevModeIndicator({
  position = 'bottom-right',
  showGitBranch = true,
  showDatabase = true,
  className,
}: DevModeIndicatorProps) {
  // Implementation
}
DevModeIndicator.displayName = 'DevModeIndicator'
```

### Hook Pattern
```typescript
// Hooks should be thin wrappers, not contain business logic
export function useFeedbackService() {
  const { prisma, auth } = useNextstackConfig()
  return useMemo(() => createFeedbackService(prisma, auth), [prisma, auth])
}
```

## Source Projects

Features are extracted from:
- **Pulse** (`/Users/dylan/projects/pulse/`) - Metrics dashboard
- **CVMeister** (`/Users/dylan/projects/cvmeister/`) - CV builder

When implementing, prefer CVMeister's patterns for:
- Element picker (12-level friendly names, comprehensive Tailwind filtering)
- Theme system (3-mode with hydration handling)
- Admin UI components

Prefer Pulse's patterns for:
- Audit logging (transaction support, field sanitization)
- Issue tracker integration architecture

## File Naming

- Components: `PascalCase.tsx` (e.g., `DevModeIndicator.tsx`)
- Utilities/services: `kebab-case.ts` (e.g., `element-picker-utils.ts`)
- Types: `types.ts` in relevant directory
- Tests: `*.test.ts` or `*.test.tsx` co-located with source

## Testing

- Unit tests for utilities and services
- Component tests with React Testing Library
- Co-locate tests with source files
- Use descriptive test names: `it('should redact password fields from audit log')`

## Git Workflow

- Feature branches: `feature/{package-name}/{feature}`
- Bug fixes: `fix/{package-name}/{description}`
- Commit messages: Describe the why, not the what
- No Claude attribution in commits
