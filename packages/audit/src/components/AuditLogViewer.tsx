'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { AuditLog, AuditAction, AuditQueryParams } from '../types'

// Icons as simple SVG components
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  )
}

function IconLogin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  )
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

const ACTION_CONFIG: Record<AuditAction, { icon: typeof IconPlus; color: string; bgColor: string }> = {
  CREATE: { icon: IconPlus, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  UPDATE: { icon: IconPencil, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  DELETE: { icon: IconTrash, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  BULK_CREATE: { icon: IconLayers, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  BULK_UPDATE: { icon: IconLayers, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  BULK_DELETE: { icon: IconLayers, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  EXPORT: { icon: IconDownload, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  IMPORT: { icon: IconUpload, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  LOGIN: { icon: IconLogin, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  LOGOUT: { icon: IconLogout, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/30' },
  VIEW: { icon: IconEye, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
}

const ALL_ACTIONS: AuditAction[] = [
  'CREATE', 'UPDATE', 'DELETE',
  'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE',
  'EXPORT', 'IMPORT',
  'LOGIN', 'LOGOUT', 'VIEW',
]

export interface AuditLogViewerProps {
  /** Function to fetch audit logs */
  fetchLogs: (params: AuditQueryParams) => Promise<{
    items: AuditLog[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>
  /** Available entity types for filtering */
  entityTypes?: string[]
  /** Default page size */
  defaultPageSize?: number
  /** Custom date formatter */
  formatDate?: (date: Date) => string
  /** Custom user display formatter */
  formatUser?: (log: AuditLog) => string
  /** Translations */
  translations?: {
    title?: string
    searchPlaceholder?: string
    entityTypeLabel?: string
    actionLabel?: string
    dateRangeLabel?: string
    allEntityTypes?: string
    allActions?: string
    noResults?: string
    loading?: string
    clearFilters?: string
    page?: string
    of?: string
    showingResults?: string
    changes?: string
    before?: string
    after?: string
    metadata?: string
    by?: string
  }
  /** Custom class name */
  className?: string
}

function formatDateDefault(date: Date): string {
  return date.toLocaleString()
}

function formatUserDefault(log: AuditLog): string {
  return log.userName || log.userEmail
}

interface ExpandedRowProps {
  log: AuditLog
  translations: NonNullable<AuditLogViewerProps['translations']>
}

function ExpandedRow({ log, translations }: ExpandedRowProps) {
  const changes = log.changes as { before?: Record<string, unknown>; after?: Record<string, unknown> } | null

  if (!changes && !log.metadata) {
    return null
  }

  return (
    <div className="px-4 py-3 bg-muted/50 border-t border-border">
      {changes && (changes.before || changes.after) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">{translations.changes}</h4>
          <div className="grid grid-cols-2 gap-4">
            {changes.before && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">{translations.before}</span>
                <pre className="mt-1 text-xs bg-red-50 dark:bg-red-950/30 p-2 rounded overflow-auto max-h-48 text-red-800 dark:text-red-200">
                  {JSON.stringify(changes.before, null, 2)}
                </pre>
              </div>
            )}
            {changes.after && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">{translations.after}</span>
                <pre className="mt-1 text-xs bg-green-50 dark:bg-green-950/30 p-2 rounded overflow-auto max-h-48 text-green-800 dark:text-green-200">
                  {JSON.stringify(changes.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      {log.metadata && (
        <div>
          <h4 className="text-sm font-medium mb-2">{translations.metadata}</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function AuditLogViewer({
  fetchLogs,
  entityTypes = [],
  defaultPageSize = 25,
  formatDate = formatDateDefault,
  formatUser = formatUserDefault,
  translations: customTranslations,
  className,
}: AuditLogViewerProps) {
  const translations = useMemo(() => ({
    title: 'Audit Log',
    searchPlaceholder: 'Search by entity or user...',
    entityTypeLabel: 'Entity Type',
    actionLabel: 'Action',
    dateRangeLabel: 'Date Range',
    allEntityTypes: 'All Types',
    allActions: 'All Actions',
    noResults: 'No audit logs found',
    loading: 'Loading...',
    clearFilters: 'Clear Filters',
    page: 'Page',
    of: 'of',
    showingResults: 'Showing {start} to {end} of {total} results',
    changes: 'Changes',
    before: 'Before',
    after: 'After',
    metadata: 'Metadata',
    by: 'by',
    ...customTranslations,
  }), [customTranslations])

  // State
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState<string>('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Load data on mount and when filters change
  useEffect(() => {
    let cancelled = false

    async function loadLogs() {
      setIsLoading(true)
      setError(null)

      try {
        const params: AuditQueryParams = {
          page,
          limit: defaultPageSize,
          ...(search && { search }),
          ...(entityType && { entityType }),
          ...(action && { action }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        }

        const result = await fetchLogs(params)
        if (!cancelled) {
          setLogs(result.items)
          setTotalPages(result.totalPages)
          setTotal(result.total)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load audit logs')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      cancelled = true
    }
  }, [fetchLogs, page, defaultPageSize, search, entityType, action, startDate, endDate])

  // Reload when filters change
  const handleFilterChange = useCallback(() => {
    setPage(1)
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setSearch('')
    setEntityType('')
    setAction('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }, [])

  const hasActiveFilters = search || entityType || action || startDate || endDate

  const showingStart = (page - 1) * defaultPageSize + 1
  const showingEnd = Math.min(page * defaultPageSize, total)
  const showingText = translations.showingResults
    .replace('{start}', showingStart.toString())
    .replace('{end}', showingEnd.toString())
    .replace('{total}', total.toString())

  return (
    <div className={`bg-background border border-border rounded-lg shadow-sm ${className || ''}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{translations.title}</h2>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
              placeholder={translations.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Entity Type Filter */}
          {entityTypes.length > 0 && (
            <div className="relative">
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value)
                  handleFilterChange()
                }}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{translations.allEntityTypes}</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <IconChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Action Filter */}
          <div className="relative">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value as AuditAction | '')
                handleFilterChange()
              }}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{translations.allActions}</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <IconChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                handleFilterChange()
              }}
              className="px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                handleFilterChange()
              }}
              className="px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconX className="w-4 h-4" />
              {translations.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            {translations.loading}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-destructive">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            {translations.noResults}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action]
              const Icon = config.icon
              const isExpanded = expandedIds.has(log.id)
              const hasDetails = log.changes || log.metadata

              return (
                <div key={log.id}>
                  <div
                    className={`px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors ${hasDetails ? 'cursor-pointer' : ''}`}
                    onClick={() => hasDetails && toggleExpanded(log.id)}
                  >
                    {/* Action Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {log.entityType}
                        </span>
                        {log.entityName && (
                          <span className="text-sm text-muted-foreground truncate">
                            "{log.entityName}"
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {translations.by} {formatUser(log)} · {formatDate(log.timestamp)}
                        {log.ipAddress && ` · ${log.ipAddress}`}
                      </div>
                    </div>

                    {/* Expand indicator */}
                    {hasDetails && (
                      <div className="flex-shrink-0">
                        <IconChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <ExpandedRow log={log} translations={translations} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      {!isLoading && logs.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{showingText}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-muted-foreground">
              {translations.page} {page} {translations.of} {totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

AuditLogViewer.displayName = 'AuditLogViewer'
