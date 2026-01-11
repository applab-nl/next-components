# @nextstack - Reusable Next.js Components Monorepo

## Implementation Status

> **Last Updated:** 2026-01-11

| Package | Status | Components | Services | Prisma Schema |
|---------|--------|------------|----------|---------------|
| **@nextstack/core** | ✅ Complete | NextstackProvider | Auth adapters (Supabase, Clerk, NextAuth) | N/A |
| **@nextstack/devtools** | ✅ Complete | DevModeIndicator, DevLoginPage | API route handler | N/A |
| **@nextstack/feedback** | ✅ Complete | FeedbackButton, FeedbackDialog, FeedbackProvider, ElementPicker, FeedbackAdmin | FeedbackService, ScreenshotCapture, IssueTrackers (Linear, Jira, GitHub) | ✅ Complete |
| **@nextstack/whats-new** | ✅ Complete | WhatsNewDialog, WhatsNewBadge | WhatsNewService | ✅ Complete |
| **@nextstack/theme** | ✅ Complete | ThemeProvider, ThemeToggle | N/A | N/A |
| **@nextstack/audit** | ✅ Complete | AuditLogViewer | AuditService, createAuditLog | ✅ Complete |
| **@nextstack/cli** | ✅ Complete | N/A | init, add, file generators | N/A |

### Build Status

All 7 packages compile successfully with TypeScript.

### What's Done

- ✅ Monorepo structure (pnpm workspaces + Turborepo)
- ✅ TypeScript configuration with project references
- ✅ ESLint 9 flat config + Prettier
- ✅ Auth adapter pattern with 3 providers
- ✅ Multi-tenancy configuration via NextstackProvider
- ✅ DevModeIndicator with git branch, database, user info
- ✅ DevLoginPage with configurable test users
- ✅ ThemeProvider with light/dark/system modes
- ✅ Audit logging with sensitive field sanitization
- ✅ i18n messages (English + Dutch) for all packages
- ✅ Element Picker component (ported from CVMeister)
- ✅ Screenshot capture with modern-screenshot
- ✅ Issue tracker integrations (Linear, Jira, GitHub)
- ✅ Prisma schemas for feedback, whats-new, audit
- ✅ Vitest testing setup with 150 passing tests
- ✅ Admin components (AuditLogViewer, FeedbackAdmin)
- ✅ WhatsNew components (WhatsNewDialog, WhatsNewBadge)
- ✅ WhatsNew hooks (useWhatsNew, useHasNewEntries)
- ✅ CLI API route generators with file generation
- ✅ Claude Code skills (/nextstack-init, /nextstack-add, /nextstack-migrate)

### What's Remaining

All planned features have been implemented.

---

## Executive Summary

This proposal outlines the architecture for extracting and standardizing reusable features from your Pulse and CVMeister projects into a monorepo of publishable packages under the `@nextstack` scope.

### Key Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Distribution | Monorepo with pnpm workspaces | Coordinated versioning, shared tooling |
| Database | Prisma with adapters | Type-safe, works with any Postgres |
| Auth | Adapter pattern (Supabase, Clerk, NextAuth) | Flexibility without lock-in |
| Styling | Tailwind + shadcn pattern | Copy source for full control |
| CLI | npx commands + Claude Code skills | Automated setup and integration |
| Location | `/Users/dylan/projects/next-components/` | Central development hub |

---

## Package Structure

```
next-components/
├── packages/
│   ├── core/                    # @nextstack/core
│   │   ├── src/
│   │   │   ├── auth/            # Auth adapter interfaces
│   │   │   ├── db/              # Prisma client utilities
│   │   │   └── config/          # Shared configuration patterns
│   │   └── package.json
│   │
│   ├── devtools/                # @nextstack/devtools
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── DevModeIndicator.tsx
│   │   │   │   └── DevLoginPage.tsx
│   │   │   ├── api/
│   │   │   │   └── dev-info.ts
│   │   │   └── config/
│   │   │       └── test-users.ts
│   │   ├── cli/
│   │   │   └── init.ts
│   │   └── package.json
│   │
│   ├── feedback/                # @nextstack/feedback
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── FeedbackButton.tsx
│   │   │   │   ├── FeedbackDialog.tsx
│   │   │   │   └── ElementPicker.tsx
│   │   │   ├── lib/
│   │   │   │   ├── element-picker-utils.ts
│   │   │   │   ├── screenshot-capture.ts
│   │   │   │   └── issue-tracker/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── prisma/
│   │   │       └── schema.prisma
│   │   ├── cli/
│   │   └── package.json
│   │
│   ├── whats-new/               # @nextstack/whats-new
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── WhatsNewDialog.tsx
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── prisma/
│   │   ├── cli/
│   │   └── package.json
│   │
│   ├── theme/                   # @nextstack/theme
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ThemeToggle.tsx
│   │   │   ├── providers/
│   │   │   │   └── ThemeProvider.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useTheme.ts
│   │   │   └── prisma/          # Optional DB persistence
│   │   └── package.json
│   │
│   ├── audit/                   # @nextstack/audit
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── audit-log.ts
│   │   │   ├── components/
│   │   │   │   └── AuditLogViewer.tsx
│   │   │   ├── api/
│   │   │   └── prisma/
│   │   ├── cli/
│   │   └── package.json
│   │
│   └── cli/                     # @nextstack/cli
│       ├── src/
│       │   ├── commands/
│       │   │   ├── init.ts
│       │   │   ├── add.ts
│       │   │   └── migrate.ts
│       │   └── utils/
│       └── package.json
│
├── apps/
│   └── docs/                    # Documentation site (optional)
│
├── claude-skills/               # Claude Code skills
│   ├── nextstack-init.md
│   ├── nextstack-add-feedback.md
│   └── nextstack-add-devtools.md
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Package Details

### 1. @nextstack/core

**Purpose**: Shared utilities, auth adapters, and database client configuration.

#### Auth Adapter Interface

```typescript
// packages/core/src/auth/types.ts
export interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
  metadata?: Record<string, unknown>
}

export interface AuthAdapter {
  /** Get current authenticated user */
  getCurrentUser(): Promise<AuthUser | null>

  /** Sign in with email/password (for dev-login) */
  signInWithPassword(email: string, password: string): Promise<AuthUser>

  /** Sign out current user */
  signOut(): Promise<void>

  /** Check if user has role */
  hasRole(user: AuthUser, role: string): boolean

  /** Get user by ID (for audit logs, feedback attribution) */
  getUserById(id: string): Promise<AuthUser | null>
}
```

#### Bundled Auth Adapters

```typescript
// packages/core/src/auth/adapters/supabase.ts
export function createSupabaseAuthAdapter(client: SupabaseClient): AuthAdapter

// packages/core/src/auth/adapters/clerk.ts
export function createClerkAuthAdapter(): AuthAdapter

// packages/core/src/auth/adapters/next-auth.ts
export function createNextAuthAdapter(options: NextAuthOptions): AuthAdapter
```

#### Database Client

```typescript
// packages/core/src/db/client.ts
import { PrismaClient } from '@prisma/client'

export function createPrismaClient(options?: PrismaClientOptions): PrismaClient
export function withTransaction<T>(
  client: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T>
```

---

### 2. @nextstack/devtools

**Purpose**: Developer experience aids for local development.

#### Components

**DevModeIndicator** - Floating widget showing environment info

```typescript
// Usage
import { DevModeIndicator } from '@nextstack/devtools'

// In your layout
<DevModeIndicator
  position="bottom-right"  // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showGitBranch={true}
  showDatabase={true}
  showUser={true}
/>
```

Features (merged from both projects):
- Current git branch (via API route)
- Database identifier (local vs production)
- Current user email/name
- Environment badge (development/staging/production)
- Collapsible panel with pulsing indicator
- Only visible on localhost by default

**DevLoginPage** - Quick login for test accounts

```typescript
// Usage - create app/dev-login/page.tsx
import { DevLoginPage } from '@nextstack/devtools'
import { testUsers } from './test-users.config'

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

#### Test Users Configuration

```typescript
// test-users.config.ts
import { defineTestUsers } from '@nextstack/devtools'

export const testUsers = defineTestUsers([
  {
    id: 'admin-user',
    email: 'admin@test.local',
    password: 'test123',
    name: 'Admin User',
    role: 'admin',
    icon: 'shield',        // lucide icon name
    color: 'purple',       // badge color
    category: 'Admins',    // grouping in UI
    description: 'Full access to all features'
  },
  {
    id: 'regular-user',
    email: 'user@test.local',
    password: 'test123',
    name: 'Regular User',
    role: 'user',
    icon: 'user',
    color: 'blue',
    category: 'Standard Users'
  },
  // ... more users
])
```

#### API Route

```typescript
// app/api/dev/info/route.ts
import { createDevInfoHandler } from '@nextstack/devtools/api'

export const GET = createDevInfoHandler({
  allowInProduction: false,  // Safety guard
  includeGitBranch: true,
  includeDbInfo: true,
  customInfo: async () => ({
    // Add project-specific info
    version: process.env.APP_VERSION
  })
})
```

#### CLI

```bash
npx @nextstack/devtools init

# Creates:
# - app/dev-login/page.tsx
# - app/api/dev/info/route.ts
# - devtools.config.ts (test users template)
# - Updates .gitignore for dev-only files
```

---

### 3. @nextstack/feedback

**Purpose**: User feedback system with element selection, screenshots, and issue tracker integration.

#### Prisma Schema

```prisma
// packages/feedback/prisma/schema.prisma
model Feedback {
  id                  String    @id @default(cuid())

  // Content
  message             String    @db.Text
  pageUrl             String

  // Element reference (optional)
  elementXPath        String?   @db.VarChar(2000)
  elementSelector     String?   @db.VarChar(500)
  elementTagName      String?   @db.VarChar(50)
  elementFriendlyName String?   @db.VarChar(200)

  // Screenshot (optional)
  screenshotUrl       String?

  // Attribution
  userId              String
  userEmail           String    // Denormalized
  userName            String?   // Denormalized
  organizationId      String?   // Optional multi-tenancy

  // Issue tracker integration
  externalIssueId     String?
  externalIssueUrl    String?
  issueProvider       String?   // 'linear' | 'jira' | 'github'
  issueCreatedAt      DateTime?
  issueCreationError  String?

  // Public suggestions & voting
  isPublicSuggestion  Boolean   @default(false)
  voteScore           Int       @default(0)

  // Status tracking
  status              String    @default("pending") // pending, reviewed, resolved, rejected
  adminNotes          String?   @db.Text
  reviewedBy          String?
  reviewedAt          DateTime?

  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  votes               FeedbackVote[]

  @@index([userId])
  @@index([organizationId])
  @@index([status])
  @@index([isPublicSuggestion, voteScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
}

model FeedbackVote {
  id         String   @id @default(cuid())
  feedbackId String
  userId     String
  voteType   String   // 'up' | 'down'
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)

  @@unique([feedbackId, userId])
  @@index([feedbackId])
  @@index([userId])
}

model IssueTrackerConfig {
  id                    String   @id @default(cuid())
  organizationId        String?  @unique  // null = global config

  provider              String?  // 'linear' | 'jira' | 'github'
  isEnabled             Boolean  @default(false)

  // Linear
  linearApiKeyEncrypted String?
  linearTeamId          String?
  linearDefaultLabels   String[] @default(["user-feedback"])

  // Jira
  jiraHost              String?
  jiraEmail             String?
  jiraApiTokenEncrypted String?
  jiraProjectKey        String?
  jiraIssueType         String?  @default("Task")
  jiraDefaultLabels     String[] @default([])

  // GitHub Issues
  githubTokenEncrypted  String?
  githubRepo            String?  // owner/repo
  githubDefaultLabels   String[] @default(["feedback"])

  // Encryption
  encryptionIv          String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### Components

**FeedbackButton** - Trigger for feedback dialog

```typescript
import { FeedbackButton } from '@nextstack/feedback'

<FeedbackButton
  position="bottom-right"
  className="custom-styles"
/>
```

**FeedbackDialog** - Main feedback form

```typescript
import { FeedbackDialog, FeedbackProvider } from '@nextstack/feedback'

// Wrap your app
<FeedbackProvider
  config={{
    enableElementPicker: true,
    enableScreenshots: true,
    maxMessageLength: 2000,
    screenshotQuality: 0.8,
  }}
>
  <App />
</FeedbackProvider>
```

**ElementPicker** - Point-and-click element selection

Features (best of both implementations):
- Visual highlighting with blue border/overlay
- Tooltip showing element name and tag
- Keyboard navigation (Tab, Enter, Escape)
- Intelligent friendly name generation (12-level priority)
- XPath and CSS selector generation
- Tailwind class filtering (200+ patterns)
- RAF throttling for performance
- Excludes picker UI from selection

**AdminFeedbackPage** - Feedback management interface

```typescript
import { AdminFeedbackPage } from '@nextstack/feedback/admin'

export default function Page() {
  return <AdminFeedbackPage />
}
```

#### Issue Tracker Service

```typescript
// packages/feedback/src/lib/issue-tracker/service.ts
export interface IssueTrackerService {
  createIssue(feedback: Feedback): Promise<{
    issueId: string
    issueUrl: string
  }>

  getIssue(issueId: string): Promise<Issue | null>
}

// Factory
export function createIssueTrackerService(
  provider: 'linear' | 'jira' | 'github',
  config: IssueTrackerConfig
): IssueTrackerService
```

#### Hooks

```typescript
// User hooks
import { useFeedback, useSuggestions } from '@nextstack/feedback'

const { submitFeedback, isSubmitting } = useFeedback()
const { suggestions, vote, isLoading } = useSuggestions()

// Admin hooks
import { useAdminFeedback, useFeedbackStats } from '@nextstack/feedback/admin'

const { feedback, updateStatus, deleteFeedback } = useAdminFeedback()
const { stats } = useFeedbackStats()
```

#### CLI

```bash
npx @nextstack/feedback init

# Creates:
# - Prisma schema additions (or separate migration)
# - API routes (app/api/feedback/...)
# - Admin page (app/admin/feedback/page.tsx)
# - Configuration file
```

---

### 4. @nextstack/whats-new

**Purpose**: Changelog/release notes with voting and feedback linking.

#### Prisma Schema

```prisma
model WhatsNewEntry {
  id          String    @id @default(cuid())

  date        DateTime
  title       String    @db.VarChar(100)
  summary     String    @db.Text
  content     String?   @db.Text  // Markdown for detailed view

  isPublished Boolean   @default(true)

  // Voting
  upvotes     Int       @default(0)
  downvotes   Int       @default(0)

  createdBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  votes          WhatsNewVote[]
  linkedFeedback WhatsNewFeedbackLink[]

  @@index([date(sort: Desc)])
  @@index([isPublished])
}

model WhatsNewVote {
  id        String   @id @default(cuid())
  entryId   String
  userId    String
  voteType  String   // 'up' | 'down'
  createdAt DateTime @default(now())

  entry     WhatsNewEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, userId])
}

model WhatsNewFeedbackLink {
  id         String   @id @default(cuid())
  entryId    String
  feedbackId String
  createdBy  String?
  createdAt  DateTime @default(now())

  entry      WhatsNewEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, feedbackId])
}
```

#### Components

```typescript
import {
  WhatsNewDialog,
  WhatsNewBadge,
  useHasNewEntries
} from '@nextstack/whats-new'

// Badge indicator for nav
const hasNew = useHasNewEntries()
<Button>
  What's New {hasNew && <WhatsNewBadge />}
</Button>

// Dialog
<WhatsNewDialog
  enableVoting={true}
  showLinkedFeedbackCount={true}
/>
```

#### Features

- Local storage tracking of last visit
- Separates "new" entries from older ones
- Voting system (up/down) with score display
- Vote propagation to linked feedback items
- Markdown content support
- Admin management interface

---

### 5. @nextstack/theme

**Purpose**: Dark mode and theme management with optional persistence.

#### Components & Hooks

```typescript
import {
  ThemeProvider,
  ThemeToggle,
  useTheme
} from '@nextstack/theme'

// Provider (in layout)
<ThemeProvider
  defaultTheme="system"           // 'light' | 'dark' | 'system'
  storageKey="app-theme"          // localStorage key
  enableSystemTheme={true}        // Allow 'system' option
  persistToDatabase={false}       // Optional DB sync
>
  <App />
</ThemeProvider>

// Toggle component
<ThemeToggle
  variant="icon"          // 'icon' | 'dropdown' | 'switch'
  showSystemOption={true}
/>

// Hook
const { theme, resolvedTheme, setTheme } = useTheme()
```

#### Theme Modes

| Mode | Behavior |
|------|----------|
| `light` | Always light theme |
| `dark` | Always dark theme |
| `system` | Follows OS preference, reacts to changes |

#### Optional Database Persistence

```prisma
// Add to user/profile table
model Profile {
  // ... existing fields
  themePreference String @default("system") // 'light' | 'dark' | 'system'
}
```

```typescript
// With DB sync
<ThemeProvider
  persistToDatabase={true}
  onThemeChange={async (theme) => {
    await updateProfile({ themePreference: theme })
  }}
  initialTheme={user?.themePreference}
/>
```

---

### 6. @nextstack/audit

**Purpose**: Comprehensive audit logging for compliance and debugging.

#### Prisma Schema

```prisma
model AuditLog {
  id             String   @id @default(cuid())

  // WHO
  userId         String?
  userEmail      String   // Denormalized (survives user deletion)
  userName       String?

  // WHEN
  timestamp      DateTime @default(now())

  // WHERE
  organizationId String?
  ipAddress      String?
  userAgent      String?

  // WHAT
  entityType     String   // 'User', 'Feedback', 'Settings', etc.
  entityId       String?
  entityName     String?
  action         String   // 'CREATE', 'UPDATE', 'DELETE', etc.

  // DETAILS
  changes        Json?    // { before: {...}, after: {...} }
  metadata       Json?    // Additional context

  @@index([organizationId])
  @@index([userId])
  @@index([timestamp(sort: Desc)])
  @@index([entityType])
  @@index([action])
  @@index([organizationId, timestamp(sort: Desc)])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  BULK_CREATE
  BULK_UPDATE
  BULK_DELETE
  EXPORT
  IMPORT
  LOGIN
  LOGOUT
  VIEW           // For sensitive data access logging
}
```

#### Core Functions

```typescript
import {
  createAuditLog,
  createAuditLogInTransaction,
  createBulkAuditLog
} from '@nextstack/audit'

// Simple audit log
await createAuditLog({
  userId: user.id,
  userEmail: user.email,
  entityType: 'Feedback',
  entityId: feedback.id,
  action: 'CREATE',
  changes: { after: feedback },
  request: req,  // Extracts IP, user-agent automatically
})

// Within a Prisma transaction
await prisma.$transaction(async (tx) => {
  const feedback = await tx.feedback.create({ data })
  await createAuditLogInTransaction(tx, {
    // ... audit data
  })
  return feedback
})

// Bulk operations
await createBulkAuditLog({
  userId: user.id,
  entityType: 'Feedback',
  action: 'BULK_DELETE',
  count: 15,
  metadata: { ids: deletedIds }
})
```

#### Security Features

- **Sensitive field sanitization** - Automatically redacts:
  - password, passwordHash, apiKey, apiToken
  - accessToken, refreshToken, secret, privateKey
  - encryptedApiToken, encryptionIv
  - And 10+ more patterns

- **IP extraction** - Supports reverse proxies:
  - x-forwarded-for
  - x-real-ip
  - cf-connecting-ip (Cloudflare)

- **Immutable logs** - No update/delete operations exposed

#### Admin Interface

```typescript
import { AuditLogViewer } from '@nextstack/audit/admin'

<AuditLogViewer
  filters={{
    entityType: true,
    action: true,
    user: true,
    dateRange: true,
    search: true,
  }}
  pageSize={50}
/>
```

---

### 7. @nextstack/cli

**Purpose**: Command-line interface for package setup and management.

#### Commands

```bash
# Initialize a new project with nextstack
npx @nextstack/cli init
# Interactive wizard:
# - Select packages to install
# - Configure auth adapter
# - Generate Prisma schema additions
# - Create API routes
# - Set up configuration files

# Add a specific package
npx @nextstack/cli add feedback
npx @nextstack/cli add devtools
npx @nextstack/cli add audit

# Run migrations
npx @nextstack/cli migrate

# Generate types (if needed)
npx @nextstack/cli generate
```

---

## Claude Code Integration

### Skills

Create custom Claude Code skills for integration tasks.

**Skill: /nextstack-init**
```markdown
Initialize @nextstack packages in the current project:
1. Detect existing setup (Next.js version, auth provider, Prisma)
2. Ask which packages to install
3. Update package.json dependencies
4. Generate Prisma schema additions
5. Create API routes
6. Set up configuration files
7. Update .gitignore
8. Run pnpm install
```

**Skill: /nextstack-add**
```markdown
Add a specific @nextstack package:
1. Verify package exists
2. Add to dependencies
3. Generate required files
4. Merge Prisma schema
5. Create API routes
6. Provide usage examples
```

**Skill: /nextstack-migrate**
```markdown
Run database migrations for @nextstack packages:
1. Generate Prisma migration
2. Apply to development database
3. Verify tables created
4. Show next steps
```

---

## Implementation Phases

### Phase 1: Foundation (Priority: Developer Experience)

1. **Set up monorepo structure**
   - Initialize pnpm workspace
   - Configure Turborepo
   - Set up TypeScript config
   - Configure ESLint/Prettier

2. **Create @nextstack/core**
   - Auth adapter interface
   - Supabase adapter (from existing code)
   - Clerk adapter (new)
   - NextAuth adapter (new)
   - Prisma client utilities

3. **Create @nextstack/devtools**
   - Extract DevModeIndicator (merge both implementations)
   - Extract DevLoginPage (merge both implementations)
   - Create dev-info API route
   - Test users configuration system
   - CLI init command

### Phase 2: Feedback System

4. **Create @nextstack/feedback**
   - Element picker (best of both)
   - Screenshot capture
   - Feedback dialog
   - Voting system
   - Issue tracker integrations (Linear, Jira, GitHub)
   - Admin interface
   - Prisma schema
   - CLI init command

### Phase 3: Supporting Features

5. **Create @nextstack/audit**
   - Core logging functions
   - Sensitive field sanitization
   - Admin viewer component
   - Prisma schema

6. **Create @nextstack/theme**
   - ThemeProvider with system support
   - ThemeToggle component
   - Optional DB persistence
   - useTheme hook

7. **Create @nextstack/whats-new**
   - WhatsNewDialog
   - Voting system
   - Feedback linking
   - Admin management

### Phase 4: CLI & Documentation

8. **Create @nextstack/cli**
   - Init command
   - Add command
   - Migrate command

9. **Create Claude Code skills**
   - /nextstack-init
   - /nextstack-add
   - /nextstack-migrate

10. **Documentation**
    - README for each package
    - Usage examples
    - Migration guide from existing code

---

## Comparison: Pulse vs CVMeister Implementations

### Developer Experience

| Feature | Pulse | CVMeister | Recommendation |
|---------|-------|-----------|----------------|
| Indicator position | N/A | Bottom-right floating | Use CVMeister's floating design |
| Git branch | N/A | API route + display | Include from CVMeister |
| Database indicator | N/A | Local/Supabase badge | Include from CVMeister |
| User display | N/A | Email in panel | Include from CVMeister |
| Collapsible | N/A | Yes, with pulsing dot | Include from CVMeister |
| Dev login categories | Yes (3 groups) | Yes (role-based) | Merge: configurable categories |
| Custom login form | No | Yes | Include from CVMeister |
| Redirect component | Yes (DevRedirect) | No | Include from Pulse |

**Recommendation**: CVMeister's indicator is more feature-rich. Merge both dev-login approaches for maximum flexibility.

### Feedback System

| Feature | Pulse | CVMeister | Recommendation |
|---------|-------|-----------|----------------|
| Element picker | Full (44KB lib) | Full (comprehensive) | Merge best parts |
| XPath generation | Yes | Yes | Both similar |
| Friendly name priority | 8 levels | 12 levels | Use CVMeister's 12-level |
| Tailwind filtering | Basic | 200+ patterns | Use CVMeister's comprehensive |
| Keyboard navigation | Yes | Yes (Tab, Enter, Esc) | Both good |
| Screenshots | Via html2canvas | Via modern-screenshot | Use modern-screenshot (smaller) |
| Screenshot highlight | N/A | Blue border + label | Include from CVMeister |
| Voting | Yes | Yes | Both similar |
| Issue tracker | Linear + Jira | Linear + Jira | Add GitHub Issues |
| Public suggestions | Yes | Yes | Both similar |
| Admin interface | Yes | Yes (more detailed) | Use CVMeister's |

**Recommendation**: CVMeister's implementation is more polished. Use it as base, add Pulse's features.

### Audit Logging

| Feature | Pulse | CVMeister | Recommendation |
|---------|-------|-----------|----------------|
| Action types | 8 enum values | String-based | Use enum for type safety |
| Sensitive field redaction | Yes (15+ patterns) | No | Include from Pulse |
| Transaction support | Yes | No | Include from Pulse |
| Bulk operations | Yes | No | Include from Pulse |
| IP extraction | Yes (proxy-aware) | Yes | Both similar |
| Admin UI | Basic | Detailed (filters, icons) | Use CVMeister's UI |
| Invitation audit | Yes (separate table) | No | Optional add-on |

**Recommendation**: Pulse's core is more robust, CVMeister's UI is better. Merge both.

### Theme/Dark Mode

| Feature | Pulse | CVMeister | Recommendation |
|---------|-------|-----------|----------------|
| Modes | 2 (light/dark) | 3 (light/dark/system) | Use CVMeister's 3-mode |
| System preference | No | Yes (with listener) | Include from CVMeister |
| Storage | localStorage only | localStorage + DB | Include both options |
| Profile sync | No | Yes (ProfileThemeSync) | Include from CVMeister |
| Hydration handling | No | Yes (prevents flash) | Include from CVMeister |

**Recommendation**: CVMeister's implementation is superior. Use it as base.

---

## Final Design Decisions

| Aspect | Decision | Notes |
|--------|----------|-------|
| **Publishing** | Git dependencies | Reference via git URLs, no npm publishing |
| **i18n** | Built-in next-intl | Ship with translation keys and integration |
| **State/Data** | Framework-agnostic | Raw fetch functions, users wrap with their preferred library |
| **Multi-tenancy** | Configurable via provider | Global config determines if `organizationId` is used |

---

## Updated Architecture Details

### Git Dependency Usage

```json
// Consumer project package.json
{
  "dependencies": {
    "@nextstack/core": "github:your-org/nextstack#packages/core",
    "@nextstack/devtools": "github:your-org/nextstack#packages/devtools",
    "@nextstack/feedback": "github:your-org/nextstack#packages/feedback"
  }
}
```

Or with pnpm workspace protocol during development:
```json
{
  "dependencies": {
    "@nextstack/core": "workspace:*"
  }
}
```

### i18n Integration (next-intl)

Each package ships with:
1. Default translation keys in `locales/en.json`
2. Type-safe translation hook wrapper
3. Instructions to merge translations into consumer projects

```typescript
// packages/devtools/src/i18n/messages.ts
export const devtoolsMessages = {
  en: {
    devMode: {
      title: 'Development Mode',
      branch: 'Branch',
      database: 'Database',
      user: 'User',
      environment: 'Environment',
      loginAs: 'Login as {name}',
      customLogin: 'Custom Login',
      // ...
    }
  }
}

// Usage with fallbacks
import { useTranslations } from 'next-intl'

export function DevModeIndicator() {
  const t = useTranslations('devMode')
  // Falls back to English if translation missing
}
```

### Framework-Agnostic Data Layer

```typescript
// packages/feedback/src/services/feedback-service.ts
export interface FeedbackService {
  submitFeedback(input: FeedbackInput): Promise<Feedback>
  getMyFeedback(): Promise<Feedback[]>
  getSuggestions(params: PaginationParams): Promise<PaginatedResponse<Feedback>>
  vote(feedbackId: string, voteType: 'up' | 'down' | null): Promise<number>
  // Admin
  getAllFeedback(params: AdminFeedbackParams): Promise<PaginatedResponse<Feedback>>
  updateFeedback(id: string, updates: FeedbackUpdate): Promise<Feedback>
  deleteFeedback(id: string): Promise<void>
}

// Factory function creates service with your Prisma client
export function createFeedbackService(
  prisma: PrismaClient,
  auth: AuthAdapter
): FeedbackService

// Users can wrap with React Query, SWR, or use directly
// Example with React Query:
export function useFeedback() {
  const service = useFeedbackService() // from context
  const queryClient = useQueryClient()

  const submitMutation = useMutation({
    mutationFn: service.submitFeedback,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback'] })
  })

  return { submitFeedback: submitMutation.mutate, isSubmitting: submitMutation.isPending }
}
```

### Multi-Tenancy Configuration

```typescript
// packages/core/src/config/nextstack-provider.tsx
export interface NextstackConfig {
  auth: AuthAdapter
  prisma: PrismaClient

  // Multi-tenancy
  multiTenancy: {
    enabled: boolean
    getOrganizationId: () => Promise<string | null>  // Called when enabled
  }

  // Feature flags
  features?: {
    feedback?: boolean
    audit?: boolean
    whatsNew?: boolean
  }
}

export function NextstackProvider({
  config,
  children
}: {
  config: NextstackConfig
  children: React.ReactNode
}) {
  return (
    <NextstackContext.Provider value={config}>
      {children}
    </NextstackContext.Provider>
  )
}

// Usage
<NextstackProvider
  config={{
    auth: createSupabaseAuthAdapter(supabase),
    prisma,
    multiTenancy: {
      enabled: true,
      getOrganizationId: async () => {
        const user = await getCurrentUser()
        return user?.organizationId ?? null
      }
    }
  }}
>
  <App />
</NextstackProvider>
```

---

## Next Steps

### Completed

- [x] ~~Approve this proposal~~ - Approved
- [x] ~~Create monorepo structure~~ - pnpm workspace, Turborepo, TypeScript configured
- [x] ~~Phase 1: @nextstack/core + @nextstack/devtools~~ - Auth adapters, DevModeIndicator, DevLoginPage complete
- [x] ~~Phase 3: @nextstack/theme~~ - ThemeProvider with 3-mode support complete
- [x] ~~Phase 2: @nextstack/feedback~~ - ElementPicker, screenshot capture, issue trackers (Linear, Jira, GitHub) complete
- [x] ~~Prisma schemas~~ - All schemas created for feedback, whats-new, audit

### All Phases Complete

- [x] ~~Phase 1: @nextstack/core + @nextstack/devtools~~ - Complete
- [x] ~~Phase 2: @nextstack/feedback~~ - Complete with ElementPicker, screenshots, issue trackers
- [x] ~~Phase 3: @nextstack/whats-new + @nextstack/theme + @nextstack/audit~~ - Complete
- [x] ~~Phase 4: @nextstack/cli + Claude Code skills~~ - Complete

### All Packages Ready

All packages are ready to use in your projects:

1. **@nextstack/core** - Add to your project and configure NextstackProvider
2. **@nextstack/devtools** - Add DevModeIndicator and DevLoginPage
3. **@nextstack/theme** - Add ThemeProvider for dark mode support
4. **@nextstack/audit** - Use createAuditLog() and AuditLogViewer
5. **@nextstack/feedback** - Full feedback system with:
   - FeedbackButton and FeedbackDialog components
   - ElementPicker for element selection
   - Screenshot capture with modern-screenshot
   - Issue tracker integrations (Linear, Jira, GitHub)
   - FeedbackAdmin for management
6. **@nextstack/whats-new** - Changelog system with:
   - WhatsNewDialog and WhatsNewBadge components
   - Voting with upvotes/downvotes
   - Last visit tracking
7. **@nextstack/cli** - CLI with file generators:
   - `npx @nextstack/cli init` - Interactive setup
   - `npx @nextstack/cli add <package>` - Add specific package
   - Generates API routes, provider setup, Prisma schemas

### Claude Code Skills

Available in `.claude/commands/`:
- `/nextstack-init` - Initialize @nextstack in a project
- `/nextstack-add` - Add a specific package
- `/nextstack-migrate` - Run database migrations
