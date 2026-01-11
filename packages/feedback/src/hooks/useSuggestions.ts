'use client'

import { useState, useCallback } from 'react'
import type { Feedback } from '../types'
import { useFeedbackConfig } from '../components/FeedbackProvider'

export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface UseSuggestionsReturn {
  suggestions: Feedback[]
  pagination: PaginationInfo | null
  isLoading: boolean
  isVoting: boolean
  error: string | null
  fetchSuggestions: (params?: { page?: number; limit?: number }) => Promise<void>
  vote: (feedbackId: string, voteType: 'up' | 'down' | null) => Promise<number | null>
  clearError: () => void
}

/**
 * Hook for fetching and voting on public suggestions
 */
export function useSuggestions(): UseSuggestionsReturn {
  const config = useFeedbackConfig()
  const [suggestions, setSuggestions] = useState<Feedback[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const fetchSuggestions = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      setIsLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams({
          public: 'true',
          page: String(params?.page ?? 1),
          limit: String(params?.limit ?? 10),
        })

        const res = await fetch(`${config.apiEndpoint}?${searchParams}`)
        if (!res.ok) throw new Error('Failed to fetch suggestions')

        const data = await res.json()
        setSuggestions(data.items)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
      } finally {
        setIsLoading(false)
      }
    },
    [config.apiEndpoint]
  )

  const vote = useCallback(
    async (feedbackId: string, voteType: 'up' | 'down' | null): Promise<number | null> => {
      setIsVoting(true)
      setError(null)

      try {
        const res = await fetch(`${config.apiEndpoint}/${feedbackId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType }),
        })

        if (!res.ok) throw new Error('Failed to vote')

        const data = await res.json()

        // Update local state
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === feedbackId
              ? { ...s, voteScore: data.voteScore, currentUserVote: voteType }
              : s
          )
        )

        return data.voteScore
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to vote')
        return null
      } finally {
        setIsVoting(false)
      }
    },
    [config.apiEndpoint]
  )

  return {
    suggestions,
    pagination,
    isLoading,
    isVoting,
    error,
    fetchSuggestions,
    vote,
    clearError,
  }
}
