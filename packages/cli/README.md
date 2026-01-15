# @nextdevx/cli

Command-line interface for initializing @nextdevx packages in your Next.js project. Automatically generates configuration files, API routes, and Prisma schema additions.

## Features

- **Interactive Setup** - Guided prompts for selecting packages and auth provider
- **Code Generation** - Generates provider configuration, API routes, and boilerplate
- **Auth Provider Support** - Pre-configured adapters for Supabase, Clerk, and NextAuth
- **Prisma Integration** - Outputs necessary schema additions for database packages
- **App Router Detection** - Validates project structure before generating files

## Installation

You can run the CLI without installation using npx:

```bash
npx @nextdevx/cli init
```

Or install globally:

```bash
npm install -g @nextdevx/cli
# Then run:
nextstack init
```

## Commands

### `nextstack init`

Initialize @nextdevx in your project. This command:

1. Detects your Next.js project structure
2. Prompts you to select which packages to install
3. Prompts for your auth provider (Supabase, Clerk, or NextAuth)
4. Generates all necessary files

```bash
npx @nextdevx/cli init
```

**Example Output:**

```
@nextdevx initialization

Detected: App Router

? Which packages do you want to install? (Press <space> to select)
❯ ◉ @nextdevx/devtools - Dev mode indicator, dev-login page
  ◯ @nextdevx/feedback - Feedback system with element picker
  ◯ @nextdevx/whats-new - Changelog with voting
  ◉ @nextdevx/theme - Theme provider (light/dark/system)
  ◯ @nextdevx/audit - Audit logging system

? Which auth provider are you using?
❯ Supabase
  Clerk
  NextAuth

Generating files...

  ✓ lib/nextstack-provider.tsx
  ✓ app/api/dev/info/route.ts

✓ Generated 2 files!

Add these dependencies to your package.json:
  "dependencies": {
    "@nextdevx/core": "^0.2.0",
    "@nextdevx/devtools": "^0.2.0",
    "@nextdevx/theme": "^0.2.0",
  }

Next steps:
1. Run pnpm install
2. Add the Prisma schema additions shown above (if any)
3. Run npx prisma generate && npx prisma db push
4. Import Providers from lib/nextstack-provider.tsx in your layout
```

### `nextstack add <package>`

Add a single @nextdevx package to your existing setup.

```bash
npx @nextdevx/cli add feedback
npx @nextdevx/cli add whats-new
npx @nextdevx/cli add audit
npx @nextdevx/cli add devtools
npx @nextdevx/cli add theme
```

**Available Packages:**

| Package | Description | Requires DB |
|---------|-------------|-------------|
| `devtools` | Dev mode indicator, dev-login page | No |
| `feedback` | Feedback system with element picker | Yes |
| `whats-new` | Changelog with voting | Yes |
| `theme` | Theme provider (light/dark/system) | No |
| `audit` | Audit logging system | Yes |

**Example:**

```bash
npx @nextdevx/cli add feedback
```

```
Adding @nextdevx/feedback

Detected: App Router

? Which auth provider are you using? Supabase

Generating files...

  ✓ app/api/feedback/route.ts
  ✓ app/api/feedback/upload/route.ts

Add this Prisma schema:
  // Copy to prisma/schema.prisma
  model Feedback {
    id                  String    @id @default(cuid())
    message             String    @db.Text
    ...
  }

✓ Generated 2 files!

Add this dependency to your package.json:
  "@nextdevx/feedback": "^0.2.0"

Next steps:
1. Run pnpm install
2. Add the Prisma schema additions shown above
3. Run npx prisma generate && npx prisma db push
4. Import and use the components in your app
```

## Generated Files

### Provider File

The `init` command generates a provider file that configures all @nextdevx packages:

```typescript
// lib/nextstack-provider.tsx
'use client'

import { NextstackProvider } from '@nextdevx/core'
import { createSupabaseAuthAdapter } from '@nextdevx/core/auth/supabase'
import { ThemeProvider } from '@nextdevx/theme'
import { FeedbackProvider } from '@nextdevx/feedback'
import { supabase } from './supabase'
import { prisma } from './prisma'

export function Providers({ children }: { children: React.ReactNode }) {
  const authAdapter = createSupabaseAuthAdapter({ client: supabase })

  return (
    <NextstackProvider
      config={{
        auth: authAdapter,
        prisma,
        multiTenancy: { enabled: false, getOrganizationId: async () => null },
      }}
    >
      <ThemeProvider>
        <FeedbackProvider>
          {children}
        </FeedbackProvider>
      </ThemeProvider>
    </NextstackProvider>
  )
}
```

### API Routes

Generates API routes for packages that need them:

- **devtools**: `app/api/dev/info/route.ts`
- **feedback**: `app/api/feedback/route.ts`, `app/api/feedback/upload/route.ts`
- **whats-new**: `app/api/whats-new/route.ts`, `app/api/whats-new/[id]/vote/route.ts`
- **audit**: `app/api/admin/audit/route.ts`

## Requirements

- **Next.js 14+** with App Router
- **Prisma** (for database packages)
- **Node.js 18+**

## Auth Provider Configuration

The CLI generates auth adapter configuration based on your selection:

### Supabase

```typescript
import { createSupabaseAuthAdapter } from '@nextdevx/core/auth/supabase'
import { supabase } from './supabase'

const authAdapter = createSupabaseAuthAdapter({
  client: supabase,
  adminRoles: ['admin'],
})
```

### Clerk

```typescript
import { createClerkAuthAdapter } from '@nextdevx/core/auth/clerk'

const authAdapter = createClerkAuthAdapter({
  adminRoles: ['org:admin'],
})
```

### NextAuth

```typescript
import { createNextAuthAdapter } from '@nextdevx/core/auth/next-auth'

const authAdapter = createNextAuthAdapter({
  adminRoles: ['admin'],
})
```

## Manual Installation

If you prefer not to use the CLI, you can manually install packages:

```bash
# Install core (required)
npm install @nextdevx/core

# Install desired packages
npm install @nextdevx/devtools
npm install @nextdevx/feedback
npm install @nextdevx/whats-new
npm install @nextdevx/theme
npm install @nextdevx/audit
```

Then follow the README instructions for each package to configure providers and API routes.

## Troubleshooting

### "Could not detect Next.js App Router structure"

The CLI looks for an `app/` directory in your project root. Make sure you're running the command from your Next.js project root.

### "Pages Router detected"

@nextdevx packages require the App Router. If you're using Pages Router, you'll need to migrate to App Router first or configure components manually.

### Generated files already exist

The CLI will prompt before overwriting existing files. You can safely decline and manually merge the generated code.

## Dependencies

The CLI uses these libraries:

- **commander** - CLI argument parsing
- **prompts** - Interactive prompts
- **picocolors** - Colored terminal output

## License

MIT
