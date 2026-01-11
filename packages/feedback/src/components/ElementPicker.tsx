'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Target, MousePointer } from 'lucide-react'
import { getElementInfo, shouldExcludeElement, getElementBounds } from '../lib/element-picker-utils'
import type { ElementInfo } from '../types'

interface ElementPickerProps {
  /** Whether the picker is active */
  isOpen: boolean
  /** Callback when an element is selected */
  onSelect: (elementInfo: ElementInfo) => void
  /** Callback when selection is cancelled */
  onCancel: () => void
}

interface HighlightPosition {
  top: number
  left: number
  width: number
  height: number
}

interface TooltipPosition {
  top: number
  left: number
}

/**
 * Element picker overlay for selecting DOM elements
 *
 * Features:
 * - Visual highlighting with blue border/overlay
 * - Tooltip showing element name and tag
 * - Keyboard navigation (Tab, Enter, Escape)
 * - RAF throttling for performance
 * - Excludes picker UI from selection
 */
export function ElementPicker({ isOpen, onSelect, onCancel }: ElementPickerProps) {
  // These state variables trigger re-renders; refs hold the actual working values
  const [, setHoveredElement] = useState<Element | null>(null)
  const [highlightPosition, setHighlightPosition] = useState<HighlightPosition | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null)
  const [, setIsKeyboardMode] = useState(false)
  const [, setFocusIndex] = useState(-1)

  const rafRef = useRef<number | null>(null)
  const announcerRef = useRef<HTMLDivElement>(null)
  const hoveredElementRef = useRef<Element | null>(null)
  const focusableElementsRef = useRef<Element[]>([])

  // Get all focusable elements for keyboard navigation
  const updateFocusableElements = useCallback(() => {
    const selector =
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]'
    const elements = Array.from(document.querySelectorAll(selector)).filter(
      (el) => !shouldExcludeElement(el) && !el.closest('[data-feedback-picker-overlay]')
    )
    focusableElementsRef.current = elements
  }, [])

  // Update highlight position for an element
  const updateHighlight = useCallback((element: Element | null) => {
    if (!element) {
      setHighlightPosition(null)
      setTooltipPosition(null)
      setElementInfo(null)
      return
    }

    const bounds = getElementBounds(element)
    const info = getElementInfo(element)

    setHighlightPosition({
      top: bounds.top + window.scrollY,
      left: bounds.left + window.scrollX,
      width: bounds.width,
      height: bounds.height,
    })

    // Position tooltip above element if there's room, otherwise below
    const tooltipTop =
      bounds.top > 80 ? bounds.top + window.scrollY - 60 : bounds.bottom + window.scrollY + 10

    setTooltipPosition({
      top: tooltipTop,
      left: Math.max(10, Math.min(bounds.left + window.scrollX, window.innerWidth - 250)),
    })

    setElementInfo(info)

    // Announce to screen readers
    if (announcerRef.current) {
      announcerRef.current.textContent = `Selected: ${info.friendlyName}, ${info.tagName} element`
    }
  }, [])

  // Handle mouse movement with RAF throttling
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const target = document.elementFromPoint(e.clientX, e.clientY)

        if (target && !shouldExcludeElement(target)) {
          // Use ref for comparison to avoid dependency on hoveredElement state
          if (target !== hoveredElementRef.current) {
            hoveredElementRef.current = target
            setHoveredElement(target)
            setIsKeyboardMode(false)
            updateHighlight(target)
          }
        }
      })
    },
    [updateHighlight]
  )

  // Handle click to select element
  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Use ref for element check, get fresh elementInfo from current state
      if (hoveredElementRef.current) {
        const info = getElementInfo(hoveredElementRef.current)
        onSelect(info)
      }
    },
    [onSelect]
  )

  // Handle keyboard navigation - uses refs to avoid dependency issues
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onCancel()
          break

        case 'Tab': {
          e.preventDefault()
          setIsKeyboardMode(true)

          // Ensure focusable elements are populated before navigating
          // This fixes a race condition where the first Tab press would only populate
          // the ref without navigating, requiring a second Tab press
          let focusableElements = focusableElementsRef.current
          if (focusableElements.length === 0) {
            updateFocusableElements()
            focusableElements = focusableElementsRef.current
            // If still empty after update, no focusable elements exist
            if (focusableElements.length === 0) {
              return
            }
          }

          // Use functional update to get current focusIndex
          // Capture focusableElements in closure to ensure we use the updated list
          const elements = focusableElements
          setFocusIndex((currentIndex) => {
            const nextIndex = e.shiftKey
              ? currentIndex <= 0
                ? elements.length - 1
                : currentIndex - 1
              : currentIndex >= elements.length - 1
                ? 0
                : currentIndex + 1

            const element = elements[nextIndex]
            if (element) {
              hoveredElementRef.current = element
              setHoveredElement(element)
              updateHighlight(element)
              // Scroll element into view
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return nextIndex
          })
          break
        }

        case 'Enter':
        case ' ':
          e.preventDefault()
          // Use ref to avoid dependency on hoveredElement state
          if (hoveredElementRef.current) {
            const info = getElementInfo(hoveredElementRef.current)
            onSelect(info)
          }
          break
      }
    },
    [onCancel, onSelect, updateFocusableElements, updateHighlight]
  )

  // Set up event listeners
  useEffect(() => {
    if (!isOpen) return

    // Initial setup
    updateFocusableElements()

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('click', handleClick, { capture: true })
    document.addEventListener('keydown', handleKeyDown)

    // Prevent scrolling during picking
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick, { capture: true })
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isOpen, handleMouseMove, handleClick, handleKeyDown, updateFocusableElements])

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      hoveredElementRef.current = null
      focusableElementsRef.current = []
      setHoveredElement(null)
      setHighlightPosition(null)
      setTooltipPosition(null)
      setElementInfo(null)
      setFocusIndex(-1)
      setIsKeyboardMode(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      data-feedback-picker-overlay
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ cursor: 'crosshair' }}
    >
      {/* Semi-transparent overlay - visual only */}
      <div data-feedback-picker className="absolute inset-0 bg-black/20" />

      {/* Element highlight */}
      {highlightPosition && (
        <div
          data-feedback-picker
          className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10 transition-all duration-75 ease-out"
          style={{
            top: highlightPosition.top,
            left: highlightPosition.left,
            width: highlightPosition.width,
            height: highlightPosition.height,
          }}
        />
      )}

      {/* Element info tooltip */}
      {tooltipPosition && elementInfo && (
        <div
          data-feedback-picker
          className="pointer-events-none absolute z-10 max-w-[240px] animate-in fade-in-0 zoom-in-95 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg duration-100"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Target className="h-3 w-3 flex-shrink-0 text-blue-400" />
            <span className="truncate font-medium">{elementInfo.friendlyName}</span>
          </div>
          <div className="text-[10px] text-gray-400">&lt;{elementInfo.tagName}&gt;</div>
        </div>
      )}

      {/* Instructions panel */}
      <div
        data-feedback-picker
        className="pointer-events-auto fixed left-1/2 top-4 z-20 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <MousePointer className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Select an element</span>
          </div>

          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono dark:border-gray-600 dark:bg-gray-700">
                Tab
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono dark:border-gray-600 dark:bg-gray-700">
                Enter
              </kbd>{' '}
              to select
            </span>
            <span>
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono dark:border-gray-600 dark:bg-gray-700">
                Esc
              </kbd>{' '}
              to cancel
            </span>
          </div>

          <button
            data-feedback-picker
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
            className="ml-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Cancel element selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Screen reader announcer */}
      <div
        ref={announcerRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>,
    document.body
  )
}

ElementPicker.displayName = 'ElementPicker'
