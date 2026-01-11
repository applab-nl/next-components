'use client'

import { useState, useCallback } from 'react'
import type { FeedbackInput } from '../types'
import { useFeedbackConfig } from '../components/FeedbackProvider'

export interface UseFeedbackReturn {
  submitFeedback: (input: FeedbackInput) => Promise<boolean>
  isSubmitting: boolean
  error: string | null
  clearError: () => void
}

/**
 * Hook for submitting feedback
 */
export function useFeedback(): UseFeedbackReturn {
  const config = useFeedbackConfig()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const submitFeedback = useCallback(
    async (input: FeedbackInput): Promise<boolean> => {
      setIsSubmitting(true)
      setError(null)

      try {
        // Upload screenshot first if present
        let screenshotUrl: string | undefined
        if (input.screenshot) {
          const formData = new FormData()
          formData.append('file', input.screenshot, 'screenshot.jpg')

          const uploadRes = await fetch(config.uploadEndpoint!, {
            method: 'POST',
            body: formData,
          })

          if (!uploadRes.ok) {
            throw new Error('Failed to upload screenshot')
          }

          const uploadData = await uploadRes.json()
          screenshotUrl = uploadData.url
        }

        // Submit feedback
        const res = await fetch(config.apiEndpoint!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input.message,
            pageUrl: input.pageUrl,
            element: input.element,
            screenshotUrl,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to submit feedback')
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit feedback')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [config.apiEndpoint, config.uploadEndpoint]
  )

  return {
    submitFeedback,
    isSubmitting,
    error,
    clearError,
  }
}
