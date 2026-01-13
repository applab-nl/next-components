'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronDown, Check, Copy } from 'lucide-react'
import type { ElementInfo } from '@nextstack/core/element-picker'

export interface ElementCopyDialogTranslations {
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
  copied?: string
}

const defaultTranslations: Required<ElementCopyDialogTranslations> = {
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
  copied: 'Copied!',
}

export interface ElementCopyDialogProps {
  isOpen: boolean
  elementInfo: ElementInfo | null
  pageUrl: string
  onClose: () => void
  onCopied: () => void
  translations?: ElementCopyDialogTranslations
  t?: (key: string) => string
}

interface CopyFields {
  pageUrl: boolean
  elementName: boolean
  cssSelector: boolean
  xpath: boolean
  tagName: boolean
}

const defaultFields: CopyFields = {
  pageUrl: true,
  elementName: true,
  cssSelector: true,
  xpath: true,
  tagName: true,
}

/**
 * Format selected fields for clipboard
 */
function formatFieldsForClipboard(
  elementInfo: ElementInfo,
  pageUrl: string,
  fields: CopyFields
): string {
  const lines: string[] = []

  if (fields.pageUrl) {
    lines.push(`Page: ${pageUrl}`)
  }
  if (fields.elementName) {
    lines.push(`Element: "${elementInfo.friendlyName}"`)
  }
  if (fields.cssSelector) {
    lines.push(`Selector: ${elementInfo.cssSelector}`)
  }
  if (fields.xpath) {
    lines.push(`XPath: ${elementInfo.xpath}`)
  }
  if (fields.tagName) {
    lines.push(`Tag: ${elementInfo.tagName}`)
  }

  return lines.join('\n')
}

export function ElementCopyDialog({
  isOpen,
  elementInfo,
  pageUrl,
  onClose,
  onCopied,
  translations,
  t: translateFn,
}: ElementCopyDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [fields, setFields] = useState<CopyFields>(defaultFields)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  // Merge translations with defaults
  const labels = { ...defaultTranslations, ...translations }

  // Translation helper
  const translate = useCallback(
    (key: keyof typeof defaultTranslations) => {
      if (translateFn) {
        return translateFn(key)
      }
      return labels[key]
    },
    [translateFn, labels]
  )

  // Handle portal mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFields(defaultFields)
      setShowAdvanced(false)
      setCopyState('idle')
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Generate preview text
  const previewText = useMemo(() => {
    if (!elementInfo) return ''
    return formatFieldsForClipboard(elementInfo, pageUrl, fields)
  }, [elementInfo, pageUrl, fields])

  // Copy to clipboard
  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopyState('copied')
        setTimeout(() => {
          onCopied()
          onClose()
        }, 500)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    },
    [onCopied, onClose]
  )

  // Handle preset clicks
  const handleCssOnly = useCallback(() => {
    if (!elementInfo) return
    copyToClipboard(elementInfo.cssSelector)
  }, [elementInfo, copyToClipboard])

  const handleXpathOnly = useCallback(() => {
    if (!elementInfo) return
    copyToClipboard(elementInfo.xpath)
  }, [elementInfo, copyToClipboard])

  const handleFullPrompt = useCallback(() => {
    if (!elementInfo) return
    copyToClipboard(formatFieldsForClipboard(elementInfo, pageUrl, defaultFields))
  }, [elementInfo, pageUrl, copyToClipboard])

  // Handle custom copy
  const handleCustomCopy = useCallback(() => {
    copyToClipboard(previewText)
  }, [previewText, copyToClipboard])

  // Toggle field
  const toggleField = useCallback((field: keyof CopyFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }, [])

  if (!mounted || !isOpen || !elementInfo) return null

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 id="copy-dialog-title" className="text-sm font-semibold text-gray-900 dark:text-white">
            {translate('copyDialogTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Element name display */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="text-gray-500 dark:text-gray-400">Element: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              "{elementInfo.friendlyName}"
            </span>
          </div>

          {/* Quick Copy Presets */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {translate('quickCopy')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCssOnly}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                {translate('cssOnly')}
              </button>
              <button
                onClick={handleXpathOnly}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
              >
                {translate('xpathOnly')}
              </button>
              <button
                onClick={handleFullPrompt}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                {translate('fullPrompt')}
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {showAdvanced ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {translate('advancedOptions')}
            </button>

            {showAdvanced && (
              <div className="mt-2 pl-4 space-y-2">
                {(
                  [
                    ['pageUrl', 'fieldPageUrl'],
                    ['elementName', 'fieldElementName'],
                    ['cssSelector', 'fieldCssSelector'],
                    ['xpath', 'fieldXpath'],
                    ['tagName', 'fieldTagName'],
                  ] as const
                ).map(([field, labelKey]) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={fields[field]}
                      onChange={() => toggleField(field)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                    {translate(labelKey)}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {translate('preview')}
            </p>
            <pre className="p-3 text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-md text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap break-all border border-gray-200 dark:border-gray-700">
              {previewText || <span className="text-gray-400 italic">No fields selected</span>}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {translate('cancel')}
          </button>
          <button
            onClick={handleCustomCopy}
            disabled={!previewText || copyState === 'copied'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {copyState === 'copied' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {translate('copied')}
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {translate('copyToClipboard')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}

ElementCopyDialog.displayName = 'ElementCopyDialog'
