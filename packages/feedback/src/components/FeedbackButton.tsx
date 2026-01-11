'use client'

import { MessageSquarePlus } from 'lucide-react'
import { useFeedbackDialog } from './FeedbackProvider'

export interface FeedbackButtonProps {
  /** Additional CSS classes */
  className?: string
  /** Callback when dialog opens */
  onOpen?: () => void
  /** Callback when dialog closes - not yet implemented */
  onClose?: () => void
}

/**
 * Button to open the feedback dialog
 */
export function FeedbackButton({
  className = '',
  onOpen,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose: _onClose,
}: FeedbackButtonProps) {
  const { openDialog } = useFeedbackDialog()

  const handleClick = () => {
    openDialog()
    onOpen?.()
  }

  return (
    <button
      onClick={handleClick}
      className={`rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${className}`}
      aria-label="Send feedback"
      title="Send feedback"
    >
      <MessageSquarePlus className="h-5 w-5" />
    </button>
  )
}

FeedbackButton.displayName = 'FeedbackButton'
