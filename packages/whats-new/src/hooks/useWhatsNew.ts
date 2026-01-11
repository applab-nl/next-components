'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WhatsNewEntry } from '../types'

export interface UseWhatsNewReturn {
  entries: WhatsNewEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  vote: (entryId: string, voteType: 'up' | 'down' | null) => Promise<void>
}

export function useWhatsNew(apiEndpoint = '/api/whats-new'): UseWhatsNewReturn {
  const [entries, setEntries] = useState<WhatsNewEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(apiEndpoint)
      if (!res.ok) throw new Error('Failed to fetch entries')
      const data = await res.json()
      setEntries(data.entries ?? data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setIsLoading(false)
    }
  }, [apiEndpoint])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const vote = useCallback(
    async (entryId: string, voteType: 'up' | 'down' | null) => {
      try {
        const res = await fetch(`${apiEndpoint}/${entryId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType }),
        })
        if (!res.ok) throw new Error('Failed to vote')

        const data = await res.json()

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  currentUserVote: voteType,
                }
              : e
          )
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to vote')
      }
    },
    [apiEndpoint]
  )

  return {
    entries,
    isLoading,
    error,
    refetch: fetchEntries,
    vote,
  }
}
