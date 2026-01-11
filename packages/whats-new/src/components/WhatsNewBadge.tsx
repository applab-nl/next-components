'use client'

import { useHasNewEntries } from '../hooks/useHasNewEntries'

export interface WhatsNewBadgeProps {
  className?: string
}

/**
 * Badge indicator showing when there are new entries
 */
export function WhatsNewBadge({ className = '' }: WhatsNewBadgeProps) {
  const hasNew = useHasNewEntries()

  if (!hasNew) return null

  return (
    <span
      className={`inline-flex h-2 w-2 rounded-full bg-blue-600 ${className}`}
      aria-label="New updates available"
    />
  )
}

WhatsNewBadge.displayName = 'WhatsNewBadge'
