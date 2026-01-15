import type { PrismaClient } from '@prisma/client'
import type { AuthAdapter } from '@nextdevx/core'
import type { AuditLog, AuditQueryParams } from '../types'

export interface AuditService {
  /** Get audit logs with filtering and pagination */
  getAuditLogs(params: AuditQueryParams): Promise<{
    items: AuditLog[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>
}

export function createAuditService(
  prisma: PrismaClient,
  auth: AuthAdapter,
  options?: {
    multiTenancy?: {
      enabled: boolean
      getOrganizationId: () => Promise<string | null>
    }
  }
): AuditService {
  const getOrgId = async () => {
    if (options?.multiTenancy?.enabled) {
      return options.multiTenancy.getOrganizationId()
    }
    return null
  }

  return {
    async getAuditLogs(params) {
      const user = await auth.getCurrentUser()
      if (!user || !auth.isAdmin(user)) {
        throw new Error('Unauthorized - admin access required')
      }

      const orgId = await getOrgId()
      const page = params.page ?? 1
      const limit = Math.min(params.limit ?? 50, 100)

      const where: any = {
        ...(orgId && { organizationId: orgId }),
        ...(params.entityType && { entityType: params.entityType }),
        ...(params.action && { action: params.action }),
        ...(params.userId && { userId: params.userId }),
        ...(params.startDate && {
          timestamp: { gte: new Date(params.startDate) },
        }),
        ...(params.endDate && {
          timestamp: { lte: new Date(params.endDate) },
        }),
        ...(params.search && {
          OR: [
            { entityName: { contains: params.search, mode: 'insensitive' } },
            { userEmail: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
      }

      const [items, total] = await Promise.all([
        (prisma as any).auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        (prisma as any).auditLog.count({ where }),
      ])

      return {
        items: items as AuditLog[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    },
  }
}
