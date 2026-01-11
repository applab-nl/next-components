# @nextstack

Reusable Next.js components for building production applications. Extracted from real projects, battle-tested, and ready to use.

## Features

- **Auth Adapters** - Pluggable authentication (Supabase, Clerk, NextAuth)
- **Feedback System** - User feedback with element picker, screenshots, issue tracker integration
- **Developer Tools** - Dev mode indicator, test user login page
- **Theme System** - Light/dark/system mode with hydration handling
- **Audit Logging** - Comprehensive audit logs with sensitive field sanitization
- **What's New** - Changelog dialog with voting
- **CLI Tools** - Automated setup and file generation

## Installation

Add packages via git dependencies:

```json
{
  "dependencies": {
    "@nextstack/core": "github:applab-nl/next-components#main",
    "@nextstack/devtools": "github:applab-nl/next-components#main",
    "@nextstack/feedback": "github:applab-nl/next-components#main"
  }
}
```

Or use the CLI:

```bash
npx @nextstack/cli init
```

## Quick Start

### 1. Set Up the Provider

Create `lib/nextstack-provider.tsx`:

```tsx
import { NextstackProvider } from '@nextstack/core'
import { createSupabaseAuthAdapter } from '@nextstack/core'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextstackProvider
      config={{
        auth: createSupabaseAuthAdapter(createClient()),
        prisma,
        multiTenancy: {
          enabled: false,
          getOrganizationId: async () => null,
        },
      }}
    >
      {children}
    </NextstackProvider>
  )
}
```

### 2. Wrap Your App

In `app/layout.tsx`:

```tsx
import { Providers } from '@/lib/nextstack-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## Packages

### @nextstack/core

The foundation package providing auth adapters and configuration.

```tsx
import {
  NextstackProvider,
  useAuth,
  createSupabaseAuthAdapter,
  createClerkAuthAdapter,
  createNextAuthAdapter
} from '@nextstack/core'

// Get current user anywhere in your app
const auth = useAuth()
const user = await auth.getCurrentUser()
```

**Auth Adapters:**
- `createSupabaseAuthAdapter(client)` - For Supabase projects
- `createClerkAuthAdapter()` - For Clerk authentication
- `createNextAuthAdapter(authOptions)` - For NextAuth.js

---

### @nextstack/devtools

Developer experience tools for local development.

#### DevModeIndicator

Floating widget showing environment info (only visible in development):

```tsx
import { DevModeIndicator } from '@nextstack/devtools'

// Add to your layout
<DevModeIndicator
  position="bottom-right"
  showGitBranch={true}
  showDatabase={true}
  showUser={true}
/>
```

**Features:**
- Current git branch
- Database indicator (local vs remote)
- Current user info
- Environment badge
- Collapsible panel

#### DevLoginPage

Quick login page for test accounts:

```tsx
// app/dev-login/page.tsx
import { DevLoginPage } from '@nextstack/devtools'

const testUsers = [
  {
    id: 'admin',
    email: 'admin@test.local',
    password: 'test123',
    name: 'Admin User',
    role: 'admin',
    category: 'Admins',
    description: 'Full access',
  },
  {
    id: 'user',
    email: 'user@test.local',
    password: 'test123',
    name: 'Test User',
    role: 'user',
    category: 'Users',
  },
]

export default function Page() {
  return (
    <DevLoginPage
      users={testUsers}
      redirectTo="/dashboard"
      showCustomLogin={true}
    />
  )
}
```

---

### @nextstack/feedback

Complete feedback system with element selection, screenshots, and issue tracker integration.

#### Basic Setup

```tsx
import { FeedbackButton, FeedbackProvider } from '@nextstack/feedback'

// Wrap your app
<FeedbackProvider
  config={{
    enableElementPicker: true,
    enableScreenshots: true,
    maxMessageLength: 2000,
  }}
>
  <App />
</FeedbackProvider>

// Add the feedback button
<FeedbackButton position="bottom-right" />
```

#### Features

- **Element Picker** - Click any element to reference it in feedback
- **Screenshot Capture** - Automatic screenshots with element highlighting
- **Issue Tracker Integration** - Create issues in Linear, Jira, or GitHub
- **Voting System** - Public suggestions with upvotes/downvotes

#### Admin Interface

```tsx
import { FeedbackAdmin } from '@nextstack/feedback/admin'

export default function AdminPage() {
  return (
    <FeedbackAdmin
      fetchFeedback={async (params) => {
        const res = await fetch(`/api/feedback?${new URLSearchParams(params)}`)
        return res.json()
      }}
      onUpdateStatus={async (id, status) => {
        await fetch(`/api/feedback/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        })
      }}
    />
  )
}
```

#### Prisma Schema

Add to your `schema.prisma`:

```prisma
model Feedback {
  id                  String    @id @default(cuid())
  message             String    @db.Text
  pageUrl             String
  elementXPath        String?   @db.VarChar(2000)
  elementSelector     String?   @db.VarChar(500)
  elementFriendlyName String?   @db.VarChar(200)
  screenshotUrl       String?
  userId              String
  userEmail           String
  status              String    @default("pending")
  isPublicSuggestion  Boolean   @default(false)
  voteScore           Int       @default(0)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  votes               FeedbackVote[]
}

model FeedbackVote {
  id         String   @id @default(cuid())
  feedbackId String
  userId     String
  voteType   String   // 'up' | 'down'
  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)

  @@unique([feedbackId, userId])
}
```

---

### @nextstack/whats-new

Changelog/release notes with voting and last-visit tracking.

```tsx
import { WhatsNewDialog, WhatsNewBadge, useHasNewEntries } from '@nextstack/whats-new'

// Badge indicator for navigation
function NavItem() {
  const hasNew = useHasNewEntries()
  return (
    <button>
      What's New {hasNew && <WhatsNewBadge />}
    </button>
  )
}

// Full dialog
<WhatsNewDialog
  enableVoting={true}
  showLinkedFeedbackCount={true}
/>
```

**Features:**
- Tracks last visit in localStorage
- Separates "new" vs "older" entries
- Voting (upvotes/downvotes)
- Links to related feedback items

#### Prisma Schema

```prisma
model WhatsNewEntry {
  id          String    @id @default(cuid())
  date        DateTime
  title       String    @db.VarChar(100)
  summary     String    @db.Text
  content     String?   @db.Text
  isPublished Boolean   @default(true)
  upvotes     Int       @default(0)
  downvotes   Int       @default(0)
  createdAt   DateTime  @default(now())
  votes       WhatsNewVote[]
}

model WhatsNewVote {
  id        String   @id @default(cuid())
  entryId   String
  userId    String
  voteType  String
  entry     WhatsNewEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, userId])
}
```

---

### @nextstack/theme

Theme management with light/dark/system modes.

```tsx
import { ThemeProvider, ThemeToggle, useTheme } from '@nextstack/theme'

// Wrap your app (in layout.tsx)
<ThemeProvider
  defaultTheme="system"
  storageKey="app-theme"
>
  <App />
</ThemeProvider>

// Add a toggle button
<ThemeToggle variant="icon" />

// Use in components
function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  // resolvedTheme is 'light' or 'dark' (resolved from 'system')
}
```

**Modes:**
- `light` - Always light theme
- `dark` - Always dark theme
- `system` - Follows OS preference, updates automatically

---

### @nextstack/audit

Comprehensive audit logging with admin viewer.

#### Logging Actions

```tsx
import { createAuditLog } from '@nextstack/audit'

// Log an action
await createAuditLog({
  userId: user.id,
  userEmail: user.email,
  entityType: 'Feedback',
  entityId: feedback.id,
  action: 'CREATE',
  changes: { after: feedback },
  request: req, // Extracts IP, user-agent automatically
})
```

**Security Features:**
- Automatic sensitive field redaction (passwords, API keys, tokens)
- IP extraction with proxy support
- Immutable logs (no update/delete)

#### Admin Viewer

```tsx
import { AuditLogViewer } from '@nextstack/audit'

<AuditLogViewer
  fetchLogs={async (params) => {
    const res = await fetch(`/api/admin/audit?${new URLSearchParams(params)}`)
    return res.json()
  }}
/>
```

**Features:**
- Filter by entity type, action, user, date range
- Search functionality
- Expandable rows showing before/after changes
- Pagination

#### Prisma Schema

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  userId         String?
  userEmail      String
  timestamp      DateTime @default(now())
  entityType     String
  entityId       String?
  action         String
  changes        Json?
  metadata       Json?
  ipAddress      String?
  userAgent      String?

  @@index([timestamp(sort: Desc)])
  @@index([entityType])
  @@index([action])
}
```

---

### @nextstack/cli

Command-line tools for setup and file generation.

```bash
# Initialize a new project with @nextstack
npx @nextstack/cli init

# Add a specific package
npx @nextstack/cli add feedback
npx @nextstack/cli add devtools
npx @nextstack/cli add audit
```

**The CLI will:**
1. Detect your project structure (App Router)
2. Ask which packages to install
3. Ask which auth provider you use
4. Generate API routes
5. Generate provider setup
6. Show Prisma schema additions

---

## API Routes

Each package that needs server-side logic requires API routes. The CLI generates these, or create manually:

### Feedback API

```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createFeedbackService } from '@nextstack/feedback'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createFeedbackService(prisma, auth)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const feedback = await service.submit(body)
  return NextResponse.json(feedback)
}

export async function GET() {
  const feedback = await service.getAll()
  return NextResponse.json(feedback)
}
```

### What's New API

```typescript
// app/api/whats-new/route.ts
import { createWhatsNewService } from '@nextstack/whats-new'

const service = createWhatsNewService(prisma, auth)

export async function GET() {
  const entries = await service.getEntries()
  return NextResponse.json({ entries })
}
```

---

## Multi-Tenancy

Enable organization-based data isolation:

```tsx
<NextstackProvider
  config={{
    auth: authAdapter,
    prisma,
    multiTenancy: {
      enabled: true,
      getOrganizationId: async () => {
        const user = await authAdapter.getCurrentUser()
        return user?.organizationId ?? null
      },
    },
  }}
>
```

When enabled, all queries automatically filter by `organizationId`.

---

## i18n Support

All packages ship with English translations and support next-intl:

```typescript
// Merge package translations into your messages
import { feedbackMessages } from '@nextstack/feedback'
import { devtoolsMessages } from '@nextstack/devtools'

export const messages = {
  ...feedbackMessages.en,
  ...devtoolsMessages.en,
  // Your app messages
}
```

---

## Requirements

- Next.js 14+ (App Router)
- React 18+
- Prisma 5+
- Tailwind CSS
- TypeScript

---

## License

MIT
