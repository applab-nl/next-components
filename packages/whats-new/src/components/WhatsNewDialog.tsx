'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Sparkles,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Users,
} from 'lucide-react'
import { useWhatsNew } from '../hooks/useWhatsNew'
import type { WhatsNewEntry } from '../types'

const LAST_VISIT_KEY = 'nextstack-whats-new-last-visit'

export interface WhatsNewDialogProps {
  /** Control dialog open state externally */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Enable voting on entries */
  enableVoting?: boolean
  /** Show linked feedback count */
  showLinkedFeedbackCount?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * What's New dialog component
 *
 * Displays changelog entries with voting support and new entry highlighting.
 * Tracks user's last visit to show new entries since then.
 */
export function WhatsNewDialog({
  open: controlledOpen,
  onOpenChange,
  enableVoting = true,
  showLinkedFeedbackCount = true,
  className = '',
}: WhatsNewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showOlder, setShowOlder] = useState(false)
  const [lastVisit, setLastVisit] = useState<string | null>(null)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [optimisticEntries, setOptimisticEntries] = useState<WhatsNewEntry[] | null>(null)
  const { entries: serverEntries, isLoading, vote } = useWhatsNew()

  // Use controlled or internal state
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value)
      } else {
        setInternalOpen(value)
      }
    },
    [onOpenChange]
  )

  // Use optimistic entries if available, otherwise server entries
  const entries = optimisticEntries ?? serverEntries

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load last visit on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LAST_VISIT_KEY)
      setLastVisit(stored)
    }
  }, [])

  // Reset showOlder when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowOlder(false)
      setOptimisticEntries(null) // Clear optimistic state on open
    }
  }, [isOpen])

  // Handle dialog close - update last visit
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && isOpen) {
        // Dialog is closing - update last visit timestamp
        const now = new Date().toISOString().split('T')[0] ?? ''
        if (typeof window !== 'undefined' && now) {
          localStorage.setItem(LAST_VISIT_KEY, now)
          setLastVisit(now)
        }
      }
      setIsOpen(newOpen)
    },
    [isOpen, setIsOpen]
  )

  // Check if entry is new since last visit
  const isNewEntry = useCallback(
    (entryDate: Date | string): boolean => {
      if (!lastVisit) return true // All entries are new for first-time visitors
      const dateStr =
        entryDate instanceof Date
          ? (entryDate.toISOString().split('T')[0] ?? '')
          : (String(entryDate).split('T')[0] ?? '')
      return dateStr > lastVisit
    },
    [lastVisit]
  )

  // Separate new and older entries
  const { newEntries, olderEntries } = useMemo(() => {
    const newOnes: WhatsNewEntry[] = []
    const oldOnes: WhatsNewEntry[] = []

    entries.forEach((entry) => {
      if (isNewEntry(entry.date)) {
        newOnes.push(entry)
      } else {
        oldOnes.push(entry)
      }
    })

    return { newEntries: newOnes, olderEntries: oldOnes }
  }, [entries, isNewEntry])

  // Format date for display
  const formatDate = (date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Handle voting with optimistic update
  const handleVote = async (entryId: string, voteType: 'up' | 'down') => {
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return

    // Determine new vote
    const newVote = entry.currentUserVote === voteType ? null : voteType

    setVotingId(entryId)

    // Optimistic update
    setOptimisticEntries((prev) => {
      const base = prev ?? serverEntries
      return base.map((e) => {
        if (e.id !== entryId) return e

        let upvotes = e.upvotes
        let downvotes = e.downvotes

        // Reverse previous vote
        if (e.currentUserVote === 'up') upvotes--
        if (e.currentUserVote === 'down') downvotes--

        // Apply new vote
        if (newVote === 'up') upvotes++
        if (newVote === 'down') downvotes++

        return { ...e, currentUserVote: newVote, upvotes, downvotes }
      })
    })

    try {
      const result = await vote(entryId, newVote)
      // Update with server response
      setOptimisticEntries((prev) => {
        const base = prev ?? serverEntries
        return base.map((e) =>
          e.id === entryId
            ? { ...e, upvotes: result.upvotes, downvotes: result.downvotes, currentUserVote: newVote }
            : e
        )
      })
    } catch {
      // Revert on error
      setOptimisticEntries((prev) => {
        const base = prev ?? serverEntries
        return base.map((e) => (e.id === entryId ? entry : e))
      })
    } finally {
      setVotingId(null)
    }
  }

  if (!mounted) return null

  const dialogContent = isOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col animate-in fade-in-0 zoom-in-95 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2
              id="whats-new-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              What's New
            </h2>
            {!isLoading && newEntries.length > 0 && !showOlder && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({newEntries.length} new update{newEntries.length !== 1 ? 's' : ''})
              </span>
            )}
            {!isLoading && (showOlder || newEntries.length === 0) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({entries.length} update{entries.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-md p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-6 w-6 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No updates available yet.
            </p>
          ) : (
            <div className="space-y-4">
              {/* New entries */}
              {newEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isNew
                  enableVoting={enableVoting}
                  showLinkedFeedbackCount={showLinkedFeedbackCount}
                  onVote={handleVote}
                  isVoting={votingId === entry.id}
                  formatDate={formatDate}
                />
              ))}

              {/* Show older toggle */}
              {newEntries.length > 0 && olderEntries.length > 0 && !showOlder && (
                <button
                  type="button"
                  onClick={() => setShowOlder(true)}
                  className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                  Show {olderEntries.length} older update
                  {olderEntries.length !== 1 ? 's' : ''}
                </button>
              )}

              {/* Older entries (when no new entries or showOlder is true) */}
              {(newEntries.length === 0 || showOlder) &&
                olderEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isNew={false}
                    enableVoting={enableVoting}
                    showLinkedFeedbackCount={showLinkedFeedbackCount}
                    onVote={handleVote}
                    isVoting={votingId === entry.id}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg flex-shrink-0">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}

interface EntryCardProps {
  entry: WhatsNewEntry
  isNew: boolean
  enableVoting: boolean
  showLinkedFeedbackCount: boolean
  onVote: (entryId: string, voteType: 'up' | 'down') => void
  isVoting: boolean
  formatDate: (date: Date | string) => string
}

function EntryCard({
  entry,
  isNew,
  enableVoting,
  showLinkedFeedbackCount,
  onVote,
  isVoting,
  formatDate,
}: EntryCardProps) {
  return (
    <div
      className={`rounded-lg p-3 transition-colors ${
        isNew
          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Title and NEW badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3
          className={`text-sm font-semibold ${
            isNew
              ? 'text-amber-900 dark:text-amber-100'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {entry.title}
        </h3>
        {isNew && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500 text-white flex-shrink-0">
            NEW
          </span>
        )}
      </div>

      {/* Date and linked feedback count */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <Calendar
            className={`h-3 w-3 ${
              isNew
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span
            className={`text-xs ${
              isNew
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {formatDate(entry.date)}
          </span>
        </div>
        {showLinkedFeedbackCount &&
          entry.linkedFeedbackCount !== undefined &&
          entry.linkedFeedbackCount > 0 && (
            <div className="flex items-center gap-1">
              <Users
                className={`h-3 w-3 ${
                  isNew
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <span
                className={`text-xs ${
                  isNew
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Based on {entry.linkedFeedbackCount} user request
                {entry.linkedFeedbackCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
      </div>

      {/* Summary */}
      <p
        className={`text-sm mb-3 ${
          isNew
            ? 'text-amber-800 dark:text-amber-200'
            : 'text-gray-600 dark:text-gray-300'
        }`}
      >
        {entry.summary}
      </p>

      {/* Vote buttons */}
      {enableVoting && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(entry.id, 'up')}
            disabled={isVoting}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              entry.currentUserVote === 'up'
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                : isNew
                  ? 'bg-amber-100/50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/50'
                  : 'bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
            aria-label="Upvote"
          >
            <ThumbsUp
              className={`h-3.5 w-3.5 ${
                entry.currentUserVote === 'up' ? 'fill-current' : ''
              }`}
            />
            <span>{entry.upvotes}</span>
          </button>
          <button
            type="button"
            onClick={() => onVote(entry.id, 'down')}
            disabled={isVoting}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              entry.currentUserVote === 'down'
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                : isNew
                  ? 'bg-amber-100/50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/50'
                  : 'bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
            aria-label="Downvote"
          >
            <ThumbsDown
              className={`h-3.5 w-3.5 ${
                entry.currentUserVote === 'down' ? 'fill-current' : ''
              }`}
            />
            <span>{entry.downvotes}</span>
          </button>
        </div>
      )}
    </div>
  )
}

WhatsNewDialog.displayName = 'WhatsNewDialog'
