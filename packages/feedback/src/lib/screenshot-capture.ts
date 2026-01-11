/**
 * Screenshot capture utility for feedback system
 * Uses modern-screenshot to capture the viewport with optional element highlighting
 */

import { domToBlob } from 'modern-screenshot'

export interface CaptureOptions {
  /** Element to highlight in the screenshot */
  highlightElement?: Element | null
  /** Color of the highlight border */
  highlightColor?: string
  /** Width of the highlight border */
  highlightWidth?: number
  /** Quality of the JPEG output (0-1) */
  quality?: number
}

const DEFAULT_OPTIONS: Required<Omit<CaptureOptions, 'highlightElement'>> = {
  highlightColor: '#3b82f6', // blue-500
  highlightWidth: 3,
  quality: 0.8,
}

/**
 * Creates a highlight overlay element around the target element
 */
function createHighlightOverlay(element: Element, color: string, width: number): HTMLDivElement {
  const rect = element.getBoundingClientRect()
  const overlay = document.createElement('div')

  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top - width}px;
    left: ${rect.left - width}px;
    width: ${rect.width + width * 2}px;
    height: ${rect.height + width * 2}px;
    border: ${width}px solid ${color};
    border-radius: 4px;
    pointer-events: none;
    z-index: 999999;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  `

  // Add a subtle label
  const label = document.createElement('div')
  label.style.cssText = `
    position: absolute;
    top: -24px;
    left: -${width}px;
    background: ${color};
    color: white;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px 4px 0 0;
    font-family: system-ui, -apple-system, sans-serif;
  `
  label.textContent = 'Selected Element'
  overlay.appendChild(label)

  return overlay
}

/**
 * Captures a screenshot of the current viewport
 * Optionally highlights a specific element before capture
 */
export async function captureScreenshot(options: CaptureOptions = {}): Promise<Blob> {
  const { highlightElement, highlightColor, highlightWidth, quality } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  let overlay: HTMLDivElement | null = null

  try {
    // Add highlight overlay if element is specified
    if (highlightElement) {
      overlay = createHighlightOverlay(highlightElement, highlightColor, highlightWidth)
      document.body.appendChild(overlay)

      // Wait for next frame to ensure overlay is rendered
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }

    // Capture the screenshot using modern-screenshot
    const blob = await domToBlob(document.body, {
      scale: window.devicePixelRatio > 1 ? 1.5 : 1,
      quality: quality,
      type: 'image/jpeg',
      width: window.innerWidth,
      height: window.innerHeight,
      style: {
        // Ensure we capture from the current scroll position
        transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
      },
      filter: (element) => {
        // Ignore the feedback dialog itself
        if (element instanceof Element) {
          if (element.getAttribute('role') === 'dialog') return false
          if (element.hasAttribute('data-html2canvas-ignore')) return false
          if (element.hasAttribute('data-feedback-picker')) return false
          if (element.hasAttribute('data-feedback-picker-overlay')) return false
        }
        return true
      },
    })

    if (!blob) {
      throw new Error('Failed to create screenshot blob')
    }

    return blob
  } finally {
    // Clean up overlay
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay)
    }
  }
}

/**
 * Gets the file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check if modern-screenshot is available
 * Returns false if the optional dependency is not installed
 */
export function isScreenshotAvailable(): boolean {
  try {
    return typeof domToBlob === 'function'
  } catch {
    return false
  }
}
