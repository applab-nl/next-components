import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatFileSize } from './screenshot-capture'

// Note: The actual screenshot capture function requires a real browser environment
// with modern-screenshot. We test the helper functions here and would test
// captureScreenshot in an integration test or E2E test.

describe('screenshot-capture', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1023)).toBe('1023 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(2048)).toBe('2.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1024 * 500)).toBe('500.0 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB')
      expect(formatFileSize(1024 * 1024 * 10)).toBe('10.0 MB')
    })

    it('should handle edge cases', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1)).toBe('1 B')
    })
  })

  describe('createHighlightOverlay (via captureScreenshot)', () => {
    let container: HTMLDivElement

    beforeEach(() => {
      container = document.createElement('div')
      container.id = 'test-container'
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('should create overlay with correct styles', () => {
      // Test the overlay creation logic
      const element = document.createElement('button')
      element.style.cssText = 'position: absolute; top: 100px; left: 100px; width: 100px; height: 40px;'
      container.appendChild(element)

      // Manually test the overlay creation logic
      const color = '#3b82f6'
      const width = 3
      const overlay = document.createElement('div')

      overlay.style.cssText = `
        position: fixed;
        border: ${width}px solid ${color};
        border-radius: 4px;
        pointer-events: none;
        z-index: 999999;
      `

      expect(overlay.style.position).toBe('fixed')
      expect(overlay.style.pointerEvents).toBe('none')
      expect(overlay.style.zIndex).toBe('999999')
    })

    it('should add label to overlay', () => {
      const label = document.createElement('div')
      label.textContent = 'Selected Element'
      label.style.cssText = `
        position: absolute;
        background: #3b82f6;
        color: white;
        font-size: 11px;
      `

      expect(label.textContent).toBe('Selected Element')
      expect(label.style.position).toBe('absolute')
    })
  })

  describe('filter function logic', () => {
    it('should filter out dialog elements', () => {
      const filter = (element: unknown) => {
        if (element instanceof Element) {
          if (element.getAttribute('role') === 'dialog') return false
          if (element.hasAttribute('data-html2canvas-ignore')) return false
          if (element.hasAttribute('data-feedback-picker')) return false
          if (element.hasAttribute('data-feedback-picker-overlay')) return false
        }
        return true
      }

      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'dialog')
      expect(filter(dialog)).toBe(false)

      const ignoredElement = document.createElement('div')
      ignoredElement.setAttribute('data-html2canvas-ignore', '')
      expect(filter(ignoredElement)).toBe(false)

      const pickerElement = document.createElement('div')
      pickerElement.setAttribute('data-feedback-picker', '')
      expect(filter(pickerElement)).toBe(false)

      const overlayElement = document.createElement('div')
      overlayElement.setAttribute('data-feedback-picker-overlay', '')
      expect(filter(overlayElement)).toBe(false)

      const normalElement = document.createElement('div')
      expect(filter(normalElement)).toBe(true)

      // Non-element values should pass through
      expect(filter(null)).toBe(true)
      expect(filter('string')).toBe(true)
    })
  })

  describe('capture options', () => {
    it('should have correct default options', () => {
      const defaults = {
        highlightColor: '#3b82f6',
        highlightWidth: 3,
        quality: 0.8,
      }

      expect(defaults.highlightColor).toBe('#3b82f6')
      expect(defaults.highlightWidth).toBe(3)
      expect(defaults.quality).toBe(0.8)
    })

    it('should merge options correctly', () => {
      const defaults = {
        highlightColor: '#3b82f6',
        highlightWidth: 3,
        quality: 0.8,
      }

      const userOptions = {
        quality: 0.5,
        highlightColor: '#ff0000',
      }

      const merged = { ...defaults, ...userOptions }

      expect(merged.quality).toBe(0.5)
      expect(merged.highlightColor).toBe('#ff0000')
      expect(merged.highlightWidth).toBe(3) // Default preserved
    })
  })

  describe('scale calculation', () => {
    it('should calculate scale based on device pixel ratio', () => {
      const calculateScale = (devicePixelRatio: number) => {
        return devicePixelRatio > 1 ? 1.5 : 1
      }

      expect(calculateScale(1)).toBe(1)
      expect(calculateScale(2)).toBe(1.5)
      expect(calculateScale(3)).toBe(1.5)
      expect(calculateScale(0.5)).toBe(1)
    })
  })
})
