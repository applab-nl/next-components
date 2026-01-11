'use client'

import { useState, useEffect } from 'react'

const LAST_VISIT_KEY = 'nextstack-whats-new-last-visit'

export function useHasNewEntries(apiEndpoint = '/api/whats-new'): boolean {
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    const checkForNew = async () => {
      try {
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
        if (!lastVisit) {
          // First visit - check if any entries exist
          const res = await fetch(apiEndpoint)
          const data = await res.json()
          setHasNew((data.entries ?? data).length > 0)
          return
        }

        const lastVisitDate = new Date(lastVisit)

        // Fetch entries
        const res = await fetch(apiEndpoint)
        const data = await res.json()
        const entries = data.entries ?? data

        // Check if any entries are newer than last visit
        const hasNewEntries = entries.some(
          (e: { date: string }) => new Date(e.date) > lastVisitDate
        )
        setHasNew(hasNewEntries)
      } catch {
        setHasNew(false)
      }
    }

    checkForNew()
  }, [apiEndpoint])

  return hasNew
}
