import type { PrismaClient } from '@prisma/client'
import { getRequestMetadata } from '@nextdevx/core'
import type { AuditLogInput, AuditLog, AuditAction } from '../types'
import { sanitizeChanges } from './sanitize'

/**
 * Create an audit log entry
 *
 * @example
 * ```ts
 * await createAuditLog(prisma, {
 *   userId: user.id,
 *   userEmail: user.email,
 *   entityType: 'Feedback',
 *   entityId: feedback.id,
 *   action: 'CREATE',
 *   changes: { after: feedback },
 * }, request.headers)
 * ```
 */
export async function createAuditLog(
  prisma: PrismaClient,
  input: AuditLogInput,
  headers?: Headers
): Promise<AuditLog | null> {
  try {
    // Extract request metadata if headers provided
    const requestMeta = headers ? getRequestMetadata(headers) : { ipAddress: null, userAgent: null }

    const auditLog = await (prisma as any).auditLog.create({
      data: {
        userId: input.userId,
        userEmail: input.userEmail,
        userName: input.userName,
        organizationId: input.organizationId,
        ipAddress: input.ipAddress ?? requestMeta.ipAddress,
        userAgent: input.userAgent ?? requestMeta.userAgent,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName,
        action: input.action,
        changes: input.changes ? sanitizeChanges(input.changes) : null,
        metadata: input.metadata,
      },
    })

    return auditLog as AuditLog
  } catch (error) {
    // Log error but don't throw - audit logging should not break the application
    console.error('Failed to create audit log:', error)
    return null
  }
}

/**
 * Create audit log within a Prisma transaction
 * Use this when audit logging should be atomic with other operations
 *
 * @example
 * ```ts
 * await prisma.$transaction(async (tx) => {
 *   const feedback = await tx.feedback.create({ data })
 *   await createAuditLogInTransaction(tx, {
 *     userId: user.id,
 *     userEmail: user.email,
 *     entityType: 'Feedback',
 *     entityId: feedback.id,
 *     action: 'CREATE',
 *     changes: { after: feedback },
 *   })
 *   return feedback
 * })
 * ```
 */
export async function createAuditLogInTransaction(
  tx: PrismaClient,
  input: AuditLogInput,
  headers?: Headers
): Promise<AuditLog> {
  const requestMeta = headers ? getRequestMetadata(headers) : { ipAddress: null, userAgent: null }

  const auditLog = await (tx as any).auditLog.create({
    data: {
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      organizationId: input.organizationId,
      ipAddress: input.ipAddress ?? requestMeta.ipAddress,
      userAgent: input.userAgent ?? requestMeta.userAgent,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      action: input.action,
      changes: input.changes ? sanitizeChanges(input.changes) : null,
      metadata: input.metadata,
    },
  })

  return auditLog as AuditLog
}

/**
 * Create audit log for bulk operations
 *
 * @example
 * ```ts
 * await createBulkAuditLog(prisma, {
 *   userId: user.id,
 *   userEmail: user.email,
 *   entityType: 'Feedback',
 *   action: 'BULK_DELETE',
 *   count: 15,
 *   metadata: { ids: deletedIds },
 * })
 * ```
 */
export async function createBulkAuditLog(
  prisma: PrismaClient,
  input: Omit<AuditLogInput, 'entityId' | 'entityName'> & {
    count: number
  },
  headers?: Headers
): Promise<AuditLog | null> {
  return createAuditLog(
    prisma,
    {
      ...input,
      entityName: `${input.count} ${input.entityType}${input.count !== 1 ? 's' : ''}`,
      metadata: {
        ...input.metadata,
        bulkCount: input.count,
      },
    },
    headers
  )
}

/**
 * Bulk action types for type checking
 */
const BULK_ACTIONS: readonly AuditAction[] = [
  'BULK_CREATE',
  'BULK_UPDATE',
  'BULK_DELETE',
  'IMPORT',
  'EXPORT',
] as const

/**
 * Type guard to check if an action is a bulk action
 *
 * @example
 * ```ts
 * if (isBulkAction(log.action)) {
 *   // Handle bulk operation display differently
 *   console.log(`Bulk operation affecting ${log.metadata?.bulkCount} items`)
 * }
 * ```
 */
export function isBulkAction(action: AuditAction): boolean {
  return BULK_ACTIONS.includes(action)
}

/**
 * Format entity name for display in audit logs
 *
 * Extracts a human-readable name from an entity object using
 * common patterns (name, email, title) or entity-specific logic.
 *
 * @param entityType - The type of entity
 * @param entity - The entity object to extract name from
 * @returns Human-readable entity name
 *
 * @example
 * ```ts
 * formatEntityName('User', { name: 'John Doe', email: 'john@example.com' })
 * // Returns: "John Doe"
 *
 * formatEntityName('Feedback', { title: 'Bug report', id: 'abc123' })
 * // Returns: "Bug report"
 *
 * formatEntityName('Session', { id: 'long-uuid-here' })
 * // Returns: "long-uui" (first 8 chars of ID)
 * ```
 */
export function formatEntityName(entityType: string, entity: unknown): string {
  if (!entity || typeof entity !== 'object') return 'Unknown'

  const obj = entity as Record<string, unknown>

  // Common name patterns (check in order of preference)
  if (typeof obj.name === 'string' && obj.name) return obj.name
  if (typeof obj.title === 'string' && obj.title) return obj.title
  if (typeof obj.email === 'string' && obj.email) return obj.email
  if (typeof obj.label === 'string' && obj.label) return obj.label

  // Entity-specific patterns
  if (entityType === 'Sprint' && typeof obj.sprintNumber === 'number') {
    return `Sprint ${obj.sprintNumber}`
  }

  if (entityType === 'Version' && typeof obj.version === 'string') {
    return `v${obj.version}`
  }

  // Fallback to truncated ID
  if (typeof obj.id === 'string' && obj.id) {
    return obj.id.slice(0, 8)
  }

  return 'Unknown'
}
