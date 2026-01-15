# @nextdevx/audit

Comprehensive audit logging system for Next.js applications with automatic sensitive field sanitization, bulk operation support, and an admin viewer component.

## Features

- **Automatic Sanitization** - Sensitive fields (passwords, tokens, API keys) are automatically redacted
- **Transaction Support** - Create audit logs atomically within Prisma transactions
- **Bulk Operations** - Special handling for bulk create/update/delete operations
- **Request Metadata** - Automatic extraction of IP address and user agent
- **Multi-Tenancy** - Organization-based filtering support
- **Admin Viewer** - Pre-built component for viewing audit logs
- **Flexible Actions** - Support for CRUD, authentication, and custom actions

## Installation

```bash
npm install @nextdevx/audit
# or
pnpm add @nextdevx/audit
# or
yarn add @nextdevx/audit
```

## Quick Start

### 1. Add Prisma Model

Copy the schema from `node_modules/@nextdevx/audit/prisma/schema.prisma` to your project:

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  userId         String?
  userEmail      String
  userName       String?
  timestamp      DateTime @default(now())
  organizationId String?
  ipAddress      String?
  userAgent      String?
  entityType     String
  entityId       String?
  entityName     String?
  action         String
  changes        Json?
  metadata       Json?

  @@index([organizationId])
  @@index([userId])
  @@index([timestamp(sort: Desc)])
  @@index([entityType])
  @@index([action])
  @@index([organizationId, timestamp(sort: Desc)])
}
```

Run migrations:

```bash
npx prisma migrate dev --name add-audit-log
```

### 2. Create Audit Logs

```typescript
import { createAuditLog } from '@nextdevx/audit'

// In an API route or server action
export async function POST(request: Request) {
  const user = await auth.getCurrentUser()
  const data = await request.json()

  // Create the entity
  const feedback = await prisma.feedback.create({ data })

  // Log the action
  await createAuditLog(
    prisma,
    {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      entityType: 'Feedback',
      entityId: feedback.id,
      entityName: feedback.message.slice(0, 50),
      action: 'CREATE',
      changes: { after: feedback },
    },
    request.headers  // Optional: extracts IP and user agent
  )

  return Response.json(feedback)
}
```

## API Reference

### Core Functions

#### createAuditLog

Create an audit log entry (non-blocking, won't throw on failure).

```typescript
import { createAuditLog } from '@nextdevx/audit'

const auditLog = await createAuditLog(
  prisma,
  {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    organizationId: user.organizationId,
    entityType: 'User',
    entityId: updatedUser.id,
    entityName: updatedUser.name,
    action: 'UPDATE',
    changes: {
      before: { role: 'user' },
      after: { role: 'admin' },
    },
    metadata: { reason: 'Promoted by admin' },
  },
  request.headers
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `prisma` | `PrismaClient` | Prisma client instance |
| `input` | `AuditLogInput` | Audit log data |
| `headers` | `Headers` | Optional - Request headers for IP/user agent extraction |

**Returns:** `AuditLog | null` - The created audit log or null if creation failed

#### createAuditLogInTransaction

Create audit log within a Prisma transaction (throws on failure for atomicity).

```typescript
import { createAuditLogInTransaction } from '@nextdevx/audit'

await prisma.$transaction(async (tx) => {
  // Perform the operation
  const oldUser = await tx.user.findUnique({ where: { id } })
  const user = await tx.user.update({
    where: { id },
    data: { role: 'admin' },
  })

  // Log atomically - if this fails, the user update is rolled back
  await createAuditLogInTransaction(tx, {
    userId: currentUser.id,
    userEmail: currentUser.email,
    entityType: 'User',
    entityId: user.id,
    entityName: user.name,
    action: 'UPDATE',
    changes: {
      before: { role: oldUser.role },
      after: { role: user.role },
    },
  })

  return user
})
```

#### createBulkAuditLog

Create audit log for bulk operations.

```typescript
import { createBulkAuditLog } from '@nextdevx/audit'

// After deleting multiple items
const deleteResult = await prisma.feedback.deleteMany({
  where: { status: 'rejected' },
})

await createBulkAuditLog(
  prisma,
  {
    userId: user.id,
    userEmail: user.email,
    entityType: 'Feedback',
    action: 'BULK_DELETE',
    count: deleteResult.count,
    metadata: {
      filter: { status: 'rejected' },
    },
  },
  request.headers
)
```

### Utility Functions

#### sanitizeChanges

Manually sanitize an object (automatically applied by createAuditLog).

```typescript
import { sanitizeChanges } from '@nextdevx/audit'

const sanitized = sanitizeChanges({
  name: 'John Doe',
  password: 'secret123',
  apiKey: 'sk_live_xxx',
  nested: {
    token: 'abc123',
  },
})

// Result:
// {
//   name: 'John Doe',
//   password: '[REDACTED]',
//   apiKey: '[REDACTED]',
//   nested: {
//     token: '[REDACTED]',
//   },
// }
```

**Automatically Redacted Fields:**
- password, passwordHash
- apiKey, apiToken
- accessToken, refreshToken
- secret, privateKey
- token, credential, auth
- encryptedApiToken, encryptionIv
- directSignupNonce

#### isBulkAction

Type guard to check if an action is a bulk action.

```typescript
import { isBulkAction } from '@nextdevx/audit'

if (isBulkAction(auditLog.action)) {
  console.log(`Affected ${auditLog.metadata?.bulkCount} items`)
}
```

**Bulk Actions:** `BULK_CREATE`, `BULK_UPDATE`, `BULK_DELETE`, `EXPORT`, `IMPORT`

#### formatEntityName

Extract a human-readable name from an entity object.

```typescript
import { formatEntityName } from '@nextdevx/audit'

formatEntityName('User', { name: 'John Doe', email: 'john@example.com' })
// Returns: "John Doe"

formatEntityName('Feedback', { title: 'Bug report', id: 'abc123' })
// Returns: "Bug report"

formatEntityName('Session', { id: 'very-long-uuid-here' })
// Returns: "very-lon" (first 8 chars)
```

### Services

#### createAuditService

Factory function for creating an audit service with query capabilities.

```typescript
import { createAuditService } from '@nextdevx/audit'

const auditService = createAuditService(prisma, auth, {
  multiTenancy: {
    enabled: true,
    getOrganizationId: async () => user?.organizationId ?? null,
  },
})

// Query audit logs
const { items, total } = await auditService.getAuditLogs({
  page: 1,
  limit: 20,
  entityType: 'User',
  action: 'UPDATE',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  search: 'john',
})
```

### Components

#### AuditLogViewer

Admin component for viewing audit logs.

```tsx
import { AuditLogViewer } from '@nextdevx/audit'

<AuditLogViewer
  apiEndpoint="/api/admin/audit"
  pageSize={20}
  showFilters={true}
  className="mt-4"
/>
```

##### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/admin/audit'` | API endpoint for fetching logs |
| `pageSize` | `number` | `20` | Number of logs per page |
| `showFilters` | `boolean` | `true` | Show filter controls |
| `className` | `string` | `''` | Additional CSS classes |

## Types

```typescript
import type {
  AuditLog,
  AuditLogInput,
  AuditAction,
  AuditQueryParams,
  AuditService,
  AuditLogViewerProps,
} from '@nextdevx/audit'
```

### Key Types

```typescript
type AuditAction =
  | 'CREATE'        // Single entity created
  | 'UPDATE'        // Single entity updated
  | 'DELETE'        // Single entity deleted
  | 'BULK_CREATE'   // Multiple entities created
  | 'BULK_UPDATE'   // Multiple entities updated
  | 'BULK_DELETE'   // Multiple entities deleted
  | 'EXPORT'        // Data exported
  | 'IMPORT'        // Data imported
  | 'LOGIN'         // User logged in
  | 'LOGOUT'        // User logged out
  | 'VIEW'          // Sensitive data accessed

interface AuditLog {
  id: string
  userId: string | null
  userEmail: string
  userName: string | null
  timestamp: Date
  organizationId: string | null
  ipAddress: string | null
  userAgent: string | null
  entityType: string
  entityId: string | null
  entityName: string | null
  action: AuditAction
  changes: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

interface AuditLogInput {
  userId?: string
  userEmail: string
  userName?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  entityType: string
  entityId?: string
  entityName?: string
  action: AuditAction
  changes?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
    data?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
}

interface AuditQueryParams {
  page?: number
  limit?: number
  entityType?: string
  action?: AuditAction
  userId?: string
  startDate?: string   // ISO date string
  endDate?: string     // ISO date string
  search?: string
}
```

## Usage Patterns

### Logging Authentication Events

```typescript
// Login
await createAuditLog(prisma, {
  userId: user.id,
  userEmail: user.email,
  entityType: 'Session',
  action: 'LOGIN',
  metadata: {
    method: 'password',
    mfaUsed: true,
  },
}, request.headers)

// Logout
await createAuditLog(prisma, {
  userId: user.id,
  userEmail: user.email,
  entityType: 'Session',
  action: 'LOGOUT',
}, request.headers)
```

### Logging Data Export

```typescript
await createAuditLog(prisma, {
  userId: user.id,
  userEmail: user.email,
  entityType: 'Report',
  action: 'EXPORT',
  metadata: {
    format: 'csv',
    filters: queryParams,
    recordCount: exportedRows.length,
  },
}, request.headers)
```

### Logging Sensitive Data Access

```typescript
// For compliance (HIPAA, GDPR, etc.)
await createAuditLog(prisma, {
  userId: user.id,
  userEmail: user.email,
  entityType: 'Customer',
  entityId: customer.id,
  entityName: customer.name,
  action: 'VIEW',
  metadata: {
    fields: ['ssn', 'dateOfBirth', 'medicalHistory'],
    reason: 'Customer support request #12345',
  },
}, request.headers)
```

### With Prisma Middleware

```typescript
// prisma/middleware/audit.ts
import { createAuditLog } from '@nextdevx/audit'

prisma.$use(async (params, next) => {
  const result = await next(params)

  // Log certain operations automatically
  if (params.model === 'User' && params.action === 'update') {
    await createAuditLog(globalPrisma, {
      entityType: 'User',
      entityId: params.args.where.id,
      action: 'UPDATE',
      changes: {
        data: params.args.data,
      },
    })
  }

  return result
})
```

## API Route Example

```typescript
// app/api/admin/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAuditService } from '@nextdevx/audit'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await auth.getCurrentUser()
  if (!user || !auth.isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const service = createAuditService(prisma, auth)

  const result = await service.getAuditLogs({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 20,
    entityType: searchParams.get('entityType') ?? undefined,
    action: searchParams.get('action') as any ?? undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  })

  return NextResponse.json(result)
}
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `react` | >=18.0.0 | Yes |
| `next` | >=14.0.0 | Yes |
| `@prisma/client` | >=5.0.0 | Yes |
| `lucide-react` | >=0.300.0 | Yes |

## License

MIT
