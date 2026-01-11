'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { FeedbackConfig } from '../types'

interface FeedbackContextValue {
  config: FeedbackConfig
  isDialogOpen: boolean
  openDialog: () => void
  closeDialog: () => void
}

const defaultConfig: FeedbackConfig = {
  enableElementPicker: true,
  enableScreenshots: true,
  maxMessageLength: 2000,
  screenshotQuality: 0.8,
  apiEndpoint: '/api/feedback',
  uploadEndpoint: '/api/feedback/upload',
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export interface FeedbackProviderProps {
  children: ReactNode
  config?: Partial<FeedbackConfig>
}

/**
 * Provider for the feedback system
 */
export function FeedbackProvider({ children, config }: FeedbackProviderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fullConfig: FeedbackConfig = {
    ...defaultConfig,
    ...config,
  }

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  return (
    <FeedbackContext.Provider
      value={{
        config: fullConfig,
        isDialogOpen,
        openDialog,
        closeDialog,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedbackDialog() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedbackDialog must be used within a FeedbackProvider')
  }
  return context
}

export function useFeedbackConfig() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedbackConfig must be used within a FeedbackProvider')
  }
  return context.config
}
