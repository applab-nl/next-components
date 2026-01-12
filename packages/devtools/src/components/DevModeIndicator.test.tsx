import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DevModeIndicator } from './DevModeIndicator'
import * as environmentModule from '../utils/environment'

// Mock @nextstack/core
vi.mock('@nextstack/core', () => ({
  useAuthOptional: vi.fn(),
}))

// Mock environment utilities
vi.mock('../utils/environment', () => ({
  isLocalhost: vi.fn(),
  getEnvironmentName: vi.fn(),
}))

// Import the mocked module
import { useAuthOptional } from '@nextstack/core'

describe('DevModeIndicator', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch

    // Default mocks
    vi.mocked(environmentModule.isLocalhost).mockReturnValue(true)
    vi.mocked(environmentModule.getEnvironmentName).mockReturnValue(
      'development'
    )
    vi.mocked(useAuthOptional).mockReturnValue(null)
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ branch: 'main', database: 'dev-db' }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('visibility', () => {
    it('should render on localhost by default', () => {
      vi.mocked(environmentModule.isLocalhost).mockReturnValue(true)

      render(<DevModeIndicator />)

      expect(
        screen.getByRole('status', { name: 'Development mode indicator' })
      ).toBeInTheDocument()
    })

    it('should not render when not on localhost with localhostOnly=true', () => {
      vi.mocked(environmentModule.isLocalhost).mockReturnValue(false)

      render(<DevModeIndicator localhostOnly={true} />)

      expect(
        screen.queryByRole('status', { name: 'Development mode indicator' })
      ).not.toBeInTheDocument()
    })

    it('should render when not on localhost with localhostOnly=false', () => {
      vi.mocked(environmentModule.isLocalhost).mockReturnValue(false)

      render(<DevModeIndicator localhostOnly={false} />)

      expect(
        screen.getByRole('status', { name: 'Development mode indicator' })
      ).toBeInTheDocument()
    })
  })

  describe('collapsed state', () => {
    it('should show collapsed indicator button initially', () => {
      render(<DevModeIndicator />)

      expect(screen.getByLabelText('Expand dev info')).toBeInTheDocument()
    })

    it('should expand when clicked', async () => {
      render(<DevModeIndicator />)

      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Dev Mode')).toBeInTheDocument()
      })
    })
  })

  describe('expanded state', () => {
    it('should show git branch from API', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({ branch: 'feature/test', database: 'test-db' }),
      })

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('feature/test')).toBeInTheDocument()
      })
    })

    it('should show database name from API', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({ branch: 'main', database: 'my-database' }),
      })

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('my-database')).toBeInTheDocument()
      })
    })

    it('should show database port from API', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            branch: 'main',
            database: 'Local',
            databasePort: 5432,
          }),
      })

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText(':5432')).toBeInTheDocument()
      })
    })

    it('should show database port from prop', async () => {
      render(<DevModeIndicator databasePort={5433} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText(':5433')).toBeInTheDocument()
      })
    })

    it('should prefer databasePort prop over API response', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            branch: 'main',
            database: 'Local',
            databasePort: 5432,
          }),
      })

      render(<DevModeIndicator databasePort={5433} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText(':5433')).toBeInTheDocument()
        expect(screen.queryByText(':5432')).not.toBeInTheDocument()
      })
    })

    it('should show databaseId prop over API database', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({ branch: 'main', database: 'api-database' }),
      })

      render(<DevModeIndicator databaseId="custom-db" />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('custom-db')).toBeInTheDocument()
        expect(screen.queryByText('api-database')).not.toBeInTheDocument()
      })
    })

    it('should show "Local" when no database info available', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ branch: 'main' }),
      })

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Local')).toBeInTheDocument()
      })
    })

    it('should show user email when authenticated', async () => {
      const mockAuth = {
        getCurrentUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
      }
      vi.mocked(useAuthOptional).mockReturnValue(mockAuth as any)

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should show "Not logged in" when no user', async () => {
      vi.mocked(useAuthOptional).mockReturnValue(null)

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Not logged in')).toBeInTheDocument()
      })
    })

    it('should show environment badge', async () => {
      vi.mocked(environmentModule.getEnvironmentName).mockReturnValue(
        'development'
      )

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('development')).toBeInTheDocument()
      })
    })

    it('should collapse when close button clicked', async () => {
      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Dev Mode')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('Collapse dev info'))

      expect(screen.queryByText('Dev Mode')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Expand dev info')).toBeInTheDocument()
    })
  })

  describe('position', () => {
    it('should apply bottom-right position by default', () => {
      render(<DevModeIndicator />)

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('bottom-4', 'right-4')
    })

    it('should apply bottom-left position', () => {
      render(<DevModeIndicator position="bottom-left" />)

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('bottom-4', 'left-4')
    })

    it('should apply top-right position', () => {
      render(<DevModeIndicator position="top-right" />)

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('top-4', 'right-4')
    })

    it('should apply top-left position', () => {
      render(<DevModeIndicator position="top-left" />)

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('top-4', 'left-4')
    })
  })

  describe('show/hide options', () => {
    it('should not show git branch when showGitBranch=false', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ branch: 'main', database: 'db' }),
      })

      render(<DevModeIndicator showGitBranch={false} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Dev Mode')).toBeInTheDocument()
      })

      expect(screen.queryByText('main')).not.toBeInTheDocument()
    })

    it('should not show database when showDatabase=false', async () => {
      render(<DevModeIndicator showDatabase={false} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Dev Mode')).toBeInTheDocument()
      })

      expect(screen.queryByText('Local')).not.toBeInTheDocument()
    })

    it('should not show user when showUser=false', async () => {
      render(<DevModeIndicator showUser={false} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Dev Mode')).toBeInTheDocument()
      })

      expect(screen.queryByText('Not logged in')).not.toBeInTheDocument()
    })
  })

  describe('custom endpoint', () => {
    it('should fetch from custom devInfoEndpoint', async () => {
      render(<DevModeIndicator devInfoEndpoint="/api/custom/dev" />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/custom/dev')
      })
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<DevModeIndicator className="my-custom-class" />)

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('my-custom-class')
    })
  })

  describe('displayName', () => {
    it('should have displayName set', () => {
      expect(DevModeIndicator.displayName).toBe('DevModeIndicator')
    })
  })

  describe('error handling', () => {
    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('unknown')).toBeInTheDocument()
      })
    })

    it('should handle auth error gracefully', async () => {
      const mockAuth = {
        getCurrentUser: vi.fn().mockRejectedValue(new Error('Auth error')),
      }
      vi.mocked(useAuthOptional).mockReturnValue(mockAuth as any)

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Not logged in')).toBeInTheDocument()
      })
    })
  })

  describe('environment badges', () => {
    it('should show green badge for development', async () => {
      vi.mocked(environmentModule.getEnvironmentName).mockReturnValue(
        'development'
      )

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        const badge = screen.getByText('development')
        expect(badge).toHaveClass('bg-green-900', 'text-green-200')
      })
    })

    it('should show yellow badge for staging', async () => {
      vi.mocked(environmentModule.getEnvironmentName).mockReturnValue('staging')

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        const badge = screen.getByText('staging')
        expect(badge).toHaveClass('bg-yellow-900', 'text-yellow-200')
      })
    })

    it('should show red badge for production', async () => {
      vi.mocked(environmentModule.getEnvironmentName).mockReturnValue(
        'production'
      )

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        const badge = screen.getByText('production')
        expect(badge).toHaveClass('bg-red-900', 'text-red-200')
      })
    })
  })
})
