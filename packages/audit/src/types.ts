export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_CREATE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'

export interface AuditLog {
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

export interface AuditLogInput {
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

export interface AuditQueryParams {
  page?: number
  limit?: number
  entityType?: string
  action?: AuditAction
  userId?: string
  startDate?: string
  endDate?: string
  search?: string
}
