'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronUp,
  ChevronDown,
  User,
  Database,
  Zap,
  GitBranch,
  MousePointer2,
  Check,
  Copy,
} from 'lucide-react'
import { useAuthOptional } from '@nextstack/core'
import { ElementPicker, type ElementInfo } from '@nextstack/core/element-picker'
import { isLocalhost, getEnvironmentName } from '../utils/environment'
import { ElementCopyDialog } from './ElementCopyDialog'

export interface DevToolsTranslations {
  badge?: string
  auth?: string
  notAuthenticated?: string
  database?: string
  environment?: string
  branch?: string
  userId?: string
  copyElement?: string
  copyElementTooltip?: string
  copied?: string
  selectElement?: string
  // Dialog translations
  copyDialogTitle?: string
  quickCopy?: string
  cssOnly?: string
  xpathOnly?: string
  fullPrompt?: string
  advancedOptions?: string
  fieldPageUrl?: string
  fieldElementName?: string
  fieldCssSelector?: string
  fieldXpath?: string
  fieldTagName?: string
  preview?: string
  copyToClipboard?: string
  cancel?: string
}

const defaultTranslations: Required<DevToolsTranslations> = {
  badge: 'DEV',
  auth: 'Auth',
  notAuthenticated: 'Not authenticated',
  database: 'Database',
  environment: 'Environment',
  branch: 'Branch',
  userId: 'ID: {id}',
  copyElement: 'Copy Element',
  copyElementTooltip: 'Select an element to copy for AI prompts',
  copied: 'Copied!',
  selectElement: 'Select element for prompt',
  // Dialog translations
  copyDialogTitle: 'Copy Element Info',
  quickCopy: 'Quick Copy',
  cssOnly: 'CSS Selector',
  xpathOnly: 'XPath',
  fullPrompt: 'Full Prompt',
  advancedOptions: 'Advanced Options',
  fieldPageUrl: 'Page URL',
  fieldElementName: 'Element Name',
  fieldCssSelector: 'CSS Selector',
  fieldXpath: 'XPath',
  fieldTagName: 'Tag Name',
  preview: 'Preview',
  copyToClipboard: 'Copy to Clipboard',
  cancel: 'Cancel',
}

export interface DevToolsProps {
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Show git branch info */
  showGitBranch?: boolean
  /** Show database info */
  showDatabase?: boolean
  /** Show current user */
  showUser?: boolean
  /** API endpoint for dev info (default: /api/dev/info) */
  devInfoEndpoint?: string
  /** Database identifier to display */
  databaseId?: string
  /** Database port to display */
  databasePort?: number | string
  /** User email to display (overrides auth context) */
  userEmail?: string | null
  /** User ID to display (overrides auth context) */
  userId?: string | null
  /** Additional CSS classes */
  className?: string
  /** Only show on localhost (default: true) */
  localhostOnly?: boolean
  /** Custom translations (for apps without next-intl) */
  translations?: DevToolsTranslations
  /** Translation function from next-intl useTranslations('devMode') */
  t?: (key: string, values?: Record<string, string>) => string
  /** Enable prompt copier feature (default: true) */
  enablePromptCopier?: boolean
  /** Keyboard shortcut for prompt copier (default: 'ctrl+shift+c', set to null to disable) */
  promptCopierShortcut?: string | null | false
}

interface DevInfo {
  branch?: string
  database?: string
  databasePort?: number | string
}

/**
 * DevTools - Floating development mode indicator with element picker
 *
 * Displays current git branch, database, user, and environment.
 * Includes a "Copy Element" feature for selecting elements and copying
 * their info to clipboard for use in AI prompts.
 *
 * Only visible in development mode by default.
 */
export function DevTools({
  position = 'bottom-right',
  showGitBranch = true,
  showDatabase = true,
  showUser = true,
  devInfoEndpoint = '/api/dev/info',
  databaseId,
  databasePort,
  userEmail: userEmailProp,
  userId: userIdProp,
  className = '',
  localhostOnly = true,
  translations,
  t: translateFn,
  enablePromptCopier = true,
  promptCopierShortcut = 'ctrl+shift+c',
}: DevToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [devInfo, setDevInfo] = useState<DevInfo>({})
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const auth = useAuthOptional()

  // Use props if provided, otherwise use auth context
  const userEmail = userEmailProp !== undefined ? userEmailProp : authUserEmail
  const userId = userIdProp !== undefined ? userIdProp : authUserId

  // Merge translations with defaults
  const labels = { ...defaultTranslations, ...translations }

  // Translation helper - uses provided t function or falls back to labels
  const translate = (key: keyof typeof defaultTranslations, values?: Record<string, string>) => {
    if (translateFn) {
      return translateFn(key, values)
    }
    let text = labels[key]
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v)
      })
    }
    return text
  }

  // Check visibility
  useEffect(() => {
    if (localhostOnly && !isLocalhost()) {
      setIsVisible(false)
      return
    }
    setIsVisible(true)
  }, [localhostOnly])

  // Fetch dev info (git branch, etc.)
  useEffect(() => {
    if (!isVisible || !showGitBranch) return

    fetch(devInfoEndpoint)
      .then((res) => res.json())
      .then((data) => setDevInfo(data))
      .catch(() => setDevInfo({ branch: 'unknown' }))
  }, [isVisible, showGitBranch, devInfoEndpoint])

  // Get current user from auth context (only if props not provided)
  useEffect(() => {
    if (!isVisible || !showUser || !auth) return
    if (userEmailProp !== undefined) return // Skip if prop provided

    auth
      .getCurrentUser()
      .then((user) => {
        setAuthUserEmail(user?.email ?? null)
        setAuthUserId(user?.id ?? null)
      })
      .catch(() => {
        setAuthUserEmail(null)
        setAuthUserId(null)
      })
  }, [isVisible, showUser, auth, userEmailProp])

  // Handle keyboard shortcut
  useEffect(() => {
    if (!isVisible || !enablePromptCopier || !promptCopierShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse shortcut (e.g., "ctrl+shift+c")
      const parts = promptCopierShortcut.toLowerCase().split('+')
      const key = parts[parts.length - 1]
      const needsCtrl = parts.includes('ctrl') || parts.includes('cmd')
      const needsShift = parts.includes('shift')
      const needsAlt = parts.includes('alt')

      const ctrlPressed = e.ctrlKey || e.metaKey
      const shiftPressed = e.shiftKey
      const altPressed = e.altKey

      if (
        e.key.toLowerCase() === key &&
        ctrlPressed === needsCtrl &&
        shiftPressed === needsShift &&
        altPressed === needsAlt
      ) {
        e.preventDefault()
        setIsPickerOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, enablePromptCopier, promptCopierShortcut])

  // Handle element selection - open dialog instead of copying immediately
  const handleElementSelect = useCallback((elementInfo: ElementInfo) => {
    setIsPickerOpen(false)
    setSelectedElement(elementInfo)
    setIsDialogOpen(true)
  }, [])

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false)
    setSelectedElement(null)
  }, [])

  // Handle successful copy from dialog
  const handleDialogCopied = useCallback(() => {
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 2000)
  }, [])

  // Handle picker cancel
  const handlePickerCancel = useCallback(() => {
    setIsPickerOpen(false)
  }, [])

  if (!isVisible) return null

  const environment = getEnvironmentName()
  const branch = devInfo.branch
  const dbName = databaseId ?? devInfo.database ?? 'Local'
  const dbPort = databasePort ?? devInfo.databasePort

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  return (
    <>
      <div
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        role="status"
        aria-label="Development mode indicator"
        data-element-picker
      >
        <div
          className={`bg-gray-900 text-white rounded-lg shadow-lg transition-all duration-200 ${
            isExpanded ? 'w-72' : 'w-auto'
          }`}
        >
          {/* Header - always visible */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 w-full text-left"
            aria-label={isExpanded ? 'Collapse dev info' : 'Expand dev info'}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-medium">
              {translate('badge')}
              {showGitBranch && branch && (
                <span className="text-orange-400 ml-1">(⎇ {branch})</span>
              )}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 ml-auto" />
            ) : (
              <ChevronUp className="h-3 w-3 ml-auto" />
            )}
          </button>

          {/* Expanded content */}
          {isExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-gray-700">
              {/* Auth Status */}
              {showUser && (
                <div className="flex items-start gap-2 pt-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{translate('auth')}</p>
                    {userEmail ? (
                      <p className="text-xs text-green-400 truncate">{userEmail}</p>
                    ) : (
                      <p className="text-xs text-yellow-400">{translate('notAuthenticated')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Database */}
              {showDatabase && (
                <div className="flex items-start gap-2">
                  <Database className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{translate('database')}</p>
                    <p className="text-xs text-blue-400">
                      {dbName}
                      {dbPort && <span className="text-gray-500">:{dbPort}</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Environment */}
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{translate('environment')}</p>
                  <p className="text-xs text-purple-400 capitalize">{environment}</p>
                </div>
              </div>

              {/* Git Branch - detailed view */}
              {showGitBranch && branch && (
                <div className="flex items-start gap-2">
                  <GitBranch className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{translate('branch')}</p>
                    <p className="text-xs text-orange-400 truncate">{branch}</p>
                  </div>
                </div>
              )}

              {/* User ID */}
              {showUser && userId && (
                <div className="pt-1 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    {translate('userId', { id: userId.substring(0, 8) + '...' })}
                  </p>
                </div>
              )}

              {/* Copy Element Button */}
              {enablePromptCopier && (
                <div className="pt-2 border-t border-gray-700">
                  <button
                    onClick={() => setIsPickerOpen(true)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 transition-colors group"
                    title={translate('copyElementTooltip')}
                  >
                    {copyState === 'copied' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-green-400">{translate('copied')}</span>
                      </>
                    ) : (
                      <>
                        <MousePointer2 className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-400" />
                        <span className="text-gray-300 group-hover:text-white">
                          {translate('copyElement')}
                        </span>
                        <Copy className="h-3 w-3 ml-auto text-gray-500 group-hover:text-gray-400" />
                      </>
                    )}
                  </button>
                  {promptCopierShortcut && (
                    <p className="text-[10px] text-gray-600 mt-1 text-center">
                      <kbd className="px-1 py-0.5 rounded bg-gray-800 font-mono">
                        {promptCopierShortcut.replace(/\+/g, ' + ').toUpperCase()}
                      </kbd>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Element Picker */}
      <ElementPicker
        isOpen={isPickerOpen}
        onSelect={handleElementSelect}
        onCancel={handlePickerCancel}
        instructionText={translate('selectElement')}
        excludeAttribute="data-element-picker"
      />

      {/* Element Copy Dialog */}
      <ElementCopyDialog
        isOpen={isDialogOpen}
        elementInfo={selectedElement}
        pageUrl={typeof window !== 'undefined' ? window.location.href : ''}
        onClose={handleDialogClose}
        onCopied={handleDialogCopied}
        translations={translations}
        t={translateFn}
      />
    </>
  )
}

DevTools.displayName = 'DevTools'
