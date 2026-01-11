'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Sparkles,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
} from 'lucide-react'
import { useWhatsNew } from '../hooks/useWhatsNew'
import type { WhatsNewEntry } from '../types'

const LAST_VISIT_KEY = 'nextstack-whats-new-last-visit'

export interface WhatsNewDialogProps {
  /** Enable voting on entries */
  enableVoting?: boolean
  /** Show linked feedback count */
  showLinkedFeedbackCount?: boolean
  /** Trigger element (renders button if not provided) */
  trigger?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

export function WhatsNewDialog({
  enableVoting = true,
  showLinkedFeedbackCount = true,
  trigger,
  className = '',
}: WhatsNewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showOlder, setShowOlder] = useState(false)
  const { entries, isLoading, vote } = useWhatsNew()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get last visit date
  const lastVisit =
    typeof window !== 'undefined'
      ? localStorage.getItem(LAST_VISIT_KEY)
      : null
  const lastVisitDate = lastVisit ? new Date(lastVisit) : null

  // Separate new and older entries
  const newEntries = lastVisitDate
    ? entries.filter((e) => new Date(e.date) > lastVisitDate)
    : entries
  const olderEntries = lastVisitDate
    ? entries.filter((e) => new Date(e.date) <= lastVisitDate)
    : []

  // Update last visit when opening
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
    }
  }, [isOpen])

  const handleVote = async (entryId: string, voteType: 'up' | 'down') => {
    const entry = entries.find((e) => e.id === entryId)
    const newVote = entry?.currentUserVote === voteType ? null : voteType
    await vote(entryId, newVote)
  }

  if (!mounted) return null

  const triggerElement = trigger ?? (
    <button
      onClick={() => setIsOpen(true)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${className}`}
    >
      <Sparkles className="h-4 w-4" />
      What's New
      {newEntries.length > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
          {newEntries.length}
        </span>
      )}
    </button>
  )

  const dialogContent = isOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
    >
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              What's New
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No updates yet</div>
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
                />
              ))}

              {/* Show older toggle */}
              {olderEntries.length > 0 && (
                <button
                  onClick={() => setShowOlder(!showOlder)}
                  className="flex w-full items-center justify-center gap-1 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showOlder ? 'Hide' : 'Show'} {olderEntries.length} older{' '}
                  {olderEntries.length === 1 ? 'update' : 'updates'}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showOlder ? 'rotate-180' : ''}`}
                  />
                </button>
              )}

              {/* Older entries */}
              {showOlder &&
                olderEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    enableVoting={enableVoting}
                    showLinkedFeedbackCount={showLinkedFeedbackCount}
                    onVote={handleVote}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{triggerElement}</div>
      {createPortal(dialogContent, document.body)}
    </>
  )
}

interface EntryCardProps {
  entry: WhatsNewEntry
  isNew?: boolean
  enableVoting: boolean
  showLinkedFeedbackCount: boolean
  onVote: (entryId: string, voteType: 'up' | 'down') => void
}

function EntryCard({
  entry,
  isNew,
  enableVoting,
  showLinkedFeedbackCount,
  onVote,
}: EntryCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isNew
          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Date and badge */}
      <div className="mb-2 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">
          {new Date(entry.date).toLocaleDateString()}
        </span>
        {isNew && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            New
          </span>
        )}
      </div>

      {/* Title and summary */}
      <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
        {entry.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.summary}</p>

      {/* Footer: voting and feedback count */}
      <div className="mt-3 flex items-center justify-between">
        {enableVoting && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote(entry.id, 'up')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-sm ${
                entry.currentUserVote === 'up'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {entry.upvotes}
            </button>
            <button
              onClick={() => onVote(entry.id, 'down')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-sm ${
                entry.currentUserVote === 'down'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              {entry.downvotes}
            </button>
          </div>
        )}

        {showLinkedFeedbackCount && entry.linkedFeedbackCount !== undefined && (
          <span className="text-xs text-gray-400">
            {entry.linkedFeedbackCount} linked feedback
          </span>
        )}
      </div>
    </div>
  )
}

WhatsNewDialog.displayName = 'WhatsNewDialog'
