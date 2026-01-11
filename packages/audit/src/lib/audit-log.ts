import type { PrismaClient } from '@prisma/client'
import { getRequestMetadata } from '@nextstack/core'
import type { AuditLogInput, AuditLog } from '../types'
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
