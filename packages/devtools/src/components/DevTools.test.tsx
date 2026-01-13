import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DevTools } from './DevTools'
import * as environmentModule from '../utils/environment'

// Mock @nextstack/core
vi.mock('@nextstack/core', () => ({
  useAuthOptional: vi.fn(),
}))

// Mock @nextstack/core/element-picker
vi.mock('@nextstack/core/element-picker', () => ({
  ElementPicker: vi.fn(({ isOpen, onSelect, onCancel }) => {
    if (!isOpen) return null
    return (
      <div data-testid="element-picker">
        <button
          onClick={() =>
            onSelect({
              friendlyName: 'Submit Button',
              cssSelector: 'button.submit',
              xpath: '//button[@class="submit"]',
              tagName: 'button',
            })
          }
        >
          Select Element
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    )
  }),
}))

// Mock environment utilities
vi.mock('../utils/environment', () => ({
  isLocalhost: vi.fn(),
  getEnvironmentName: vi.fn(),
}))

// Import the mocked module
import { useAuthOptional } from '@nextstack/core'

describe('DevTools', () => {
  const mockFetch = vi.fn()
  const mockClipboard = {
    writeText: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    })

    // Default mocks
    vi.mocked(environmentModule.isLocalhost).mockReturnValue(true)
    vi.mocked(environmentModule.getEnvironmentName).mockReturnValue(
      'development'
    )
    vi.mocked(useAuthOptional).mockReturnValue(null)
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ branch: 'main', database: 'dev-db' }),
    })
    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('prompt copier feature', () => {
    it('should show Copy Element button when expanded', async () => {
      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })
    })

    it('should not show Copy Element button when enablePromptCopier=false', async () => {
      render(<DevTools enablePromptCopier={false} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Auth')).toBeInTheDocument()
      })

      expect(screen.queryByText('Copy Element')).not.toBeInTheDocument()
    })

    it('should open element picker when Copy Element button clicked', async () => {
      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Copy Element'))

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })
    })

    it('should open copy dialog when element selected', async () => {
      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Copy Element'))

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select Element'))

      // Dialog should open with element info
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Copy Element Info')).toBeInTheDocument()
        expect(screen.getByText('"Submit Button"')).toBeInTheDocument()
      })
    })

    it('should copy full prompt when Full Prompt button clicked', async () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000/test-page' },
        writable: true,
      })

      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Copy Element'))

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select Element'))

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click Full Prompt preset
      fireEvent.click(screen.getByText('Full Prompt'))

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('Page: http://localhost:3000/test-page')
        )
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('Element: "Submit Button"')
        )
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('Selector: button.submit')
        )
      })
    })

    it('should show "Copied!" feedback in dialog after copying', async () => {
      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Copy Element'))

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select Element'))

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click Full Prompt to copy
      fireEvent.click(screen.getByText('Full Prompt'))

      // Dialog should show Copied! feedback
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('should close element picker when cancelled', async () => {
      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Copy Element'))

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByTestId('element-picker')).not.toBeInTheDocument()
      })
    })

    it('should show keyboard shortcut hint', async () => {
      render(<DevTools promptCopierShortcut="ctrl+shift+c" />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('CTRL + SHIFT + C')).toBeInTheDocument()
      })
    })

    it('should not show keyboard shortcut hint when disabled', async () => {
      render(<DevTools promptCopierShortcut={null} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      expect(screen.queryByText(/CTRL/)).not.toBeInTheDocument()
    })

    it('should open element picker with keyboard shortcut', async () => {
      render(<DevTools promptCopierShortcut="ctrl+shift+c" />)

      // Simulate keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
      })

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })
    })

    it('should not open element picker with wrong shortcut', async () => {
      render(<DevTools promptCopierShortcut="ctrl+shift+c" />)

      // Simulate wrong keyboard shortcut (missing shift)
      fireEvent.keyDown(document, {
        key: 'c',
        ctrlKey: true,
        shiftKey: false,
      })

      expect(screen.queryByTestId('element-picker')).not.toBeInTheDocument()
    })

    it('should handle clipboard write error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard denied'))

      render(<DevTools />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Copy Element')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Copy Element'))

      await waitFor(() => {
        expect(screen.getByTestId('element-picker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select Element'))

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click Full Prompt to trigger copy
      fireEvent.click(screen.getByText('Full Prompt'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to copy to clipboard:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('displayName', () => {
    it('should have displayName set', () => {
      expect(DevTools.displayName).toBe('DevTools')
    })
  })

  describe('visibility', () => {
    it('should render on localhost by default', () => {
      vi.mocked(environmentModule.isLocalhost).mockReturnValue(true)

      render(<DevTools />)

      expect(
        screen.getByRole('status', { name: 'Development mode indicator' })
      ).toBeInTheDocument()
    })

    it('should not render when not on localhost with localhostOnly=true', () => {
      vi.mocked(environmentModule.isLocalhost).mockReturnValue(false)

      render(<DevTools localhostOnly={true} />)

      expect(
        screen.queryByRole('status', { name: 'Development mode indicator' })
      ).not.toBeInTheDocument()
    })
  })

  describe('translations', () => {
    it('should use custom translations for prompt copier', async () => {
      render(
        <DevTools
          translations={{
            copyElement: 'Kopieer Element',
            copied: 'Gekopieerd!',
            selectElement: 'Selecteer element',
          }}
        />
      )

      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Kopieer Element')).toBeInTheDocument()
      })
    })
  })
})
