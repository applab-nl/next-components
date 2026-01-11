'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Loader2 } from 'lucide-react'
import { useFeedbackDialog, useFeedbackConfig } from './FeedbackProvider'
import { useFeedback } from '../hooks/useFeedback'
import type { ElementInfo } from '../types'

/**
 * Feedback dialog component
 *
 * Renders as a portal to escape any parent containment.
 */
export function FeedbackDialog() {
  const { isDialogOpen, closeDialog } = useFeedbackDialog()
  const config = useFeedbackConfig()
  const { submitFeedback, isSubmitting, error, clearError } = useFeedback()

  const [message, setMessage] = useState('')
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [screenshot, setScreenshot] = useState<Blob | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle portal mounting
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Cleanup on close
  useEffect(() => {
    if (!isDialogOpen) {
      setMessage('')
      setSelectedElement(null)
      setScreenshot(null)
      setScreenshotUrl(null)
      setShowSuccess(false)
      clearError()
    }
  }, [isDialogOpen, clearError])

  // Create object URL for screenshot preview
  useEffect(() => {
    if (screenshot) {
      const url = URL.createObjectURL(screenshot)
      setScreenshotUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setScreenshotUrl(null)
    }
  }, [screenshot])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const success = await submitFeedback({
      message: message.trim(),
      pageUrl: window.location.href,
      element: selectedElement ?? undefined,
      screenshot: screenshot ?? undefined,
    })

    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        closeDialog()
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDialog()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const remainingChars = (config.maxMessageLength ?? 2000) - message.length

  if (!mounted || !isDialogOpen) return null

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeDialog()}
      onKeyDown={handleKeyDown}
    >
      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-900/95">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              Thank you for your feedback!
            </p>
          </div>
        </div>
      )}

      {/* Dialog */}
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="feedback-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            Send Feedback
          </h2>
          <button
            onClick={closeDialog}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Message textarea */}
          <div className="mb-4">
            <label
              htmlFor="feedback-message"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your feedback
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback, suggestion, or issue..."
              maxLength={config.maxMessageLength}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 p-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              autoFocus
            />
            <div
              className={`mt-1 text-right text-xs ${
                remainingChars < 200
                  ? 'text-orange-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {remainingChars} characters remaining
            </div>
          </div>

          {/* Element picker (placeholder) */}
          {config.enableElementPicker && selectedElement && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Selected element
                  </span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedElement.friendlyName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedElement(null)}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Screenshot preview (placeholder) */}
          {screenshotUrl && (
            <div className="mb-4">
              <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <img
                  src={screenshotUrl}
                  alt="Screenshot preview"
                  className="max-h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  aria-label="Remove screenshot"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit feedback'
            )}
          </button>

          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            Press{' '}
            <kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">
              ⌘
            </kbd>
            +
            <kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">
              Enter
            </kbd>{' '}
            to submit
          </p>
        </form>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}

FeedbackDialog.displayName = 'FeedbackDialog'
