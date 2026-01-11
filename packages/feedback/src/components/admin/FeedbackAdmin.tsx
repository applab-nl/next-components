'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Feedback, FeedbackStatus } from '../../types'

// Icons
function IconMessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  )
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconThumbsUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
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

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bgColor: string; icon: typeof IconClock }> = {
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: IconClock },
  reviewed: { label: 'Reviewed', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: IconEye },
  resolved: { label: 'Resolved', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: IconCheck },
  rejected: { label: 'Rejected', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: IconX },
}

const ALL_STATUSES: FeedbackStatus[] = ['pending', 'reviewed', 'resolved', 'rejected']

export interface FeedbackQueryParams {
  page?: number
  limit?: number
  status?: FeedbackStatus
  search?: string
}

export interface FeedbackAdminProps {
  /** Function to fetch feedback */
  fetchFeedback: (params: FeedbackQueryParams) => Promise<{
    items: Feedback[]
    total: number
  }>
  /** Function to update feedback status */
  updateStatus: (id: string, status: FeedbackStatus, adminNotes?: string) => Promise<Feedback>
  /** Function to toggle public suggestion */
  togglePublicSuggestion: (id: string, isPublic: boolean) => Promise<Feedback>
  /** Function to delete feedback */
  deleteFeedback: (id: string) => Promise<void>
  /** Function to create issue (optional) */
  createIssue?: (feedbackId: string) => Promise<{ issueUrl: string }>
  /** Default page size */
  defaultPageSize?: number
  /** Custom date formatter */
  formatDate?: (date: Date) => string
  /** Translations */
  translations?: {
    title?: string
    searchPlaceholder?: string
    statusLabel?: string
    allStatuses?: string
    noResults?: string
    loading?: string
    clearFilters?: string
    page?: string
    of?: string
    showingResults?: string
    from?: string
    markAs?: string
    adminNotes?: string
    addNotes?: string
    saveNotes?: string
    cancel?: string
    makePublic?: string
    makePrivate?: string
    delete?: string
    confirmDelete?: string
    createIssue?: string
    viewIssue?: string
    screenshot?: string
    element?: string
    votes?: string
  }
  /** Custom class name */
  className?: string
}

function formatDateDefault(date: Date): string {
  return date.toLocaleString()
}

interface StatusDropdownProps {
  currentStatus: FeedbackStatus
  onChange: (status: FeedbackStatus) => void
  translations: NonNullable<FeedbackAdminProps['translations']>
}

function StatusDropdown({ currentStatus, onChange, translations }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = STATUS_CONFIG[currentStatus]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity`}
      >
        <config.icon className="w-3 h-3" />
        {config.label}
        <IconChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-background border border-border rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {translations.markAs}
              </div>
              {ALL_STATUSES.map((status) => {
                const statusConfig = STATUS_CONFIG[status]
                return (
                  <button
                    key={status}
                    onClick={() => {
                      onChange(status)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                      status === currentStatus ? 'bg-muted' : ''
                    }`}
                  >
                    <statusConfig.icon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
                    {statusConfig.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface FeedbackRowProps {
  feedback: Feedback
  formatDate: (date: Date) => string
  translations: NonNullable<FeedbackAdminProps['translations']>
  onUpdateStatus: (id: string, status: FeedbackStatus, notes?: string) => Promise<void>
  onTogglePublic: (id: string, isPublic: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreateIssue?: (id: string) => Promise<void>
}

function FeedbackRow({
  feedback,
  formatDate,
  translations,
  onUpdateStatus,
  onTogglePublic,
  onDelete,
  onCreateIssue,
}: FeedbackRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(feedback.adminNotes || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (status: FeedbackStatus) => {
    setIsLoading(true)
    try {
      await onUpdateStatus(feedback.id, status)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsLoading(true)
    try {
      await onUpdateStatus(feedback.id, feedback.status, notes)
      setIsEditingNotes(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublic = async () => {
    setIsLoading(true)
    try {
      await onTogglePublic(feedback.id, !feedback.isPublicSuggestion)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(translations.confirmDelete)) return
    setIsLoading(true)
    try {
      await onDelete(feedback.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateIssue = async () => {
    if (!onCreateIssue) return
    setIsLoading(true)
    try {
      await onCreateIssue(feedback.id)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`border-b border-border last:border-b-0 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Main row */}
      <div
        className="px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <IconMessageSquare className="w-4 h-4 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusDropdown
              currentStatus={feedback.status}
              onChange={handleStatusChange}
              translations={translations}
            />
            {feedback.isPublicSuggestion && (
              <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                <IconGlobe className="w-3 h-3" />
                Public
              </span>
            )}
            {feedback.externalIssueUrl && (
              <a
                href={feedback.externalIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded hover:opacity-80"
              >
                {feedback.issueProvider?.toUpperCase()}
                <IconExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <p className="mt-1 text-sm text-foreground line-clamp-2">{feedback.message}</p>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{translations.from} {feedback.userName || feedback.userEmail}</span>
            <span>·</span>
            <span>{formatDate(feedback.createdAt)}</span>
            {feedback.voteScore !== 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <IconThumbsUp className="w-3 h-3" />
                  {feedback.voteScore}
                </span>
              </>
            )}
            {feedback.screenshotUrl && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <IconImage className="w-3 h-3" />
                  {translations.screenshot}
                </span>
              </>
            )}
            {feedback.elementFriendlyName && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <IconTarget className="w-3 h-3" />
                  {feedback.elementFriendlyName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        <IconChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border">
          {/* Full message */}
          <div className="mb-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">{feedback.message}</p>
          </div>

          {/* Page URL */}
          <div className="mb-3">
            <a
              href={feedback.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {feedback.pageUrl}
            </a>
          </div>

          {/* Element info */}
          {feedback.elementFriendlyName && (
            <div className="mb-3 text-xs">
              <span className="font-medium">{translations.element}:</span>{' '}
              <span className="text-muted-foreground">{feedback.elementFriendlyName}</span>
              {feedback.elementTagName && (
                <span className="ml-2 text-muted-foreground">({`<${feedback.elementTagName}>`})</span>
              )}
            </div>
          )}

          {/* Screenshot */}
          {feedback.screenshotUrl && (
            <div className="mb-4">
              <a
                href={feedback.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src={feedback.screenshotUrl}
                  alt="Screenshot"
                  className="max-w-md rounded border border-border"
                />
              </a>
            </div>
          )}

          {/* Admin notes */}
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">{translations.adminNotes}</div>
            {isEditingNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                  placeholder={translations.addNotes}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    {translations.saveNotes}
                  </button>
                  <button
                    onClick={() => {
                      setNotes(feedback.adminNotes || '')
                      setIsEditingNotes(false)
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {translations.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingNotes(true)}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {feedback.adminNotes || <span className="italic">{translations.addNotes}</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              onClick={handleTogglePublic}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                feedback.isPublicSuggestion
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                  : 'text-muted-foreground bg-muted hover:bg-muted/80'
              }`}
            >
              <IconGlobe className="w-3.5 h-3.5" />
              {feedback.isPublicSuggestion ? translations.makePrivate : translations.makePublic}
            </button>

            {onCreateIssue && !feedback.externalIssueUrl && (
              <button
                onClick={handleCreateIssue}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
              >
                <IconExternalLink className="w-3.5 h-3.5" />
                {translations.createIssue}
              </button>
            )}

            {feedback.externalIssueUrl && (
              <a
                href={feedback.externalIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
              >
                <IconExternalLink className="w-3.5 h-3.5" />
                {translations.viewIssue}
              </a>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ml-auto"
            >
              <IconTrash className="w-3.5 h-3.5" />
              {translations.delete}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function FeedbackAdmin({
  fetchFeedback,
  updateStatus,
  togglePublicSuggestion,
  deleteFeedback,
  createIssue,
  defaultPageSize = 25,
  formatDate = formatDateDefault,
  translations: customTranslations,
  className,
}: FeedbackAdminProps) {
  const translations = useMemo(() => ({
    title: 'Feedback Management',
    searchPlaceholder: 'Search feedback...',
    statusLabel: 'Status',
    allStatuses: 'All Statuses',
    noResults: 'No feedback found',
    loading: 'Loading...',
    clearFilters: 'Clear',
    page: 'Page',
    of: 'of',
    showingResults: 'Showing {start} to {end} of {total}',
    from: 'from',
    markAs: 'Mark as',
    adminNotes: 'Admin Notes',
    addNotes: 'Click to add notes...',
    saveNotes: 'Save',
    cancel: 'Cancel',
    makePublic: 'Make Public',
    makePrivate: 'Make Private',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this feedback?',
    createIssue: 'Create Issue',
    viewIssue: 'View Issue',
    screenshot: 'Screenshot',
    element: 'Element',
    votes: 'votes',
    ...customTranslations,
  }), [customTranslations])

  // State
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const totalPages = Math.ceil(total / defaultPageSize)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FeedbackStatus | ''>('')
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Load data on mount and when filters change
  useEffect(() => {
    let cancelled = false

    async function loadFeedback() {
      setIsLoading(true)
      setError(null)

      try {
        const params: FeedbackQueryParams = {
          page,
          limit: defaultPageSize,
          ...(search && { search }),
          ...(status && { status }),
        }

        const result = await fetchFeedback(params)
        if (!cancelled) {
          setFeedbackList(result.items)
          setTotal(result.total)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load feedback')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadFeedback()

    return () => {
      cancelled = true
    }
  }, [fetchFeedback, page, defaultPageSize, search, status, reloadTrigger])

  const handleFilterChange = useCallback(() => {
    setPage(1)
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: FeedbackStatus, notes?: string) => {
    const updated = await updateStatus(id, newStatus, notes)
    setFeedbackList(prev => prev.map(f => f.id === id ? updated : f))
  }

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    const updated = await togglePublicSuggestion(id, isPublic)
    setFeedbackList(prev => prev.map(f => f.id === id ? updated : f))
  }

  const handleDelete = async (id: string) => {
    await deleteFeedback(id)
    setFeedbackList(prev => prev.filter(f => f.id !== id))
    setTotal(prev => prev - 1)
  }

  const handleCreateIssue = createIssue ? async (id: string) => {
    await createIssue(id)
    // Reload to get updated issue info
    setReloadTrigger(prev => prev + 1)
  } : undefined

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatus('')
    setPage(1)
  }, [])

  const hasActiveFilters = search || status

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

          {/* Status Filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as FeedbackStatus | '')
                handleFilterChange()
              }}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{translations.allStatuses}</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <IconChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
        ) : feedbackList.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            {translations.noResults}
          </div>
        ) : (
          <div>
            {feedbackList.map((feedback) => (
              <FeedbackRow
                key={feedback.id}
                feedback={feedback}
                formatDate={formatDate}
                translations={translations}
                onUpdateStatus={handleUpdateStatus}
                onTogglePublic={handleTogglePublic}
                onDelete={handleDelete}
                onCreateIssue={handleCreateIssue}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      {!isLoading && feedbackList.length > 0 && (
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

FeedbackAdmin.displayName = 'FeedbackAdmin'
