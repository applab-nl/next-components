import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DevModeIndicator } from './DevModeIndicator'
import * as environmentModule from '../utils/environment'

// Mock @nextdevx/core
vi.mock('@nextdevx/core', () => ({
  useAuthOptional: vi.fn(),
}))

// Mock environment utilities
vi.mock('../utils/environment', () => ({
  isLocalhost: vi.fn(),
  getEnvironmentName: vi.fn(),
}))

// Import the mocked module
import { useAuthOptional } from '@nextdevx/core'

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
    it('should show DEV badge with expand button initially', () => {
      render(<DevModeIndicator />)

      expect(screen.getByText('DEV')).toBeInTheDocument()
      expect(screen.getByLabelText('Expand dev info')).toBeInTheDocument()
    })

    it('should show branch in header when available', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ branch: 'feature/test' }),
      })

      render(<DevModeIndicator />)

      await waitFor(() => {
        expect(screen.getByText(/⎇ feature\/test/)).toBeInTheDocument()
      })
    })

    it('should expand when clicked', async () => {
      render(<DevModeIndicator />)

      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Auth')).toBeInTheDocument()
      })
    })
  })

  describe('expanded state', () => {
    it('should show all sections when expanded', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ branch: 'main', database: 'test-db' }),
      })

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Auth')).toBeInTheDocument()
        expect(screen.getByText('Database')).toBeInTheDocument()
        expect(screen.getByText('Environment')).toBeInTheDocument()
        expect(screen.getByText('Branch')).toBeInTheDocument()
      })
    })

    it('should show database name from API', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ branch: 'main', database: 'my-database' }),
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
        getCurrentUser: vi
          .fn()
          .mockResolvedValue({ email: 'test@example.com', id: '12345678-abcd' }),
      }
      vi.mocked(useAuthOptional).mockReturnValue(mockAuth as any)

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should show "Not authenticated" when no user', async () => {
      vi.mocked(useAuthOptional).mockReturnValue(null)

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument()
      })
    })

    it('should show user ID when authenticated', async () => {
      const mockAuth = {
        getCurrentUser: vi
          .fn()
          .mockResolvedValue({ email: 'test@example.com', id: '12345678-abcd-efgh' }),
      }
      vi.mocked(useAuthOptional).mockReturnValue(mockAuth as any)

      render(<DevModeIndicator />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('ID: 12345678...')).toBeInTheDocument()
      })
    })

    it('should show environment', async () => {
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
        expect(screen.getByText('Auth')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('Collapse dev info'))

      expect(screen.queryByText('Auth')).not.toBeInTheDocument()
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
        expect(screen.getByText('Auth')).toBeInTheDocument()
      })

      // Branch label should not be visible
      expect(screen.queryByText('Branch')).not.toBeInTheDocument()
      // Branch in header should not be visible either
      expect(screen.queryByText(/⎇/)).not.toBeInTheDocument()
    })

    it('should not show database when showDatabase=false', async () => {
      render(<DevModeIndicator showDatabase={false} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Auth')).toBeInTheDocument()
      })

      expect(screen.queryByText('Database')).not.toBeInTheDocument()
    })

    it('should not show user when showUser=false', async () => {
      render(<DevModeIndicator showUser={false} />)
      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Environment')).toBeInTheDocument()
      })

      expect(screen.queryByText('Auth')).not.toBeInTheDocument()
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

  describe('translations', () => {
    it('should use custom translations object', async () => {
      render(
        <DevModeIndicator
          translations={{
            badge: 'ONTWIKKELING',
            auth: 'Authenticatie',
            notAuthenticated: 'Niet ingelogd',
          }}
        />
      )

      expect(screen.getByText('ONTWIKKELING')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Authenticatie')).toBeInTheDocument()
        expect(screen.getByText('Niet ingelogd')).toBeInTheDocument()
      })
    })

    it('should use translation function when provided', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          badge: 'DEV-FR',
          auth: 'Authentification',
          notAuthenticated: 'Non connecté',
          database: 'Base de données',
          environment: 'Environnement',
        }
        return translations[key] || key
      })

      render(<DevModeIndicator t={mockT} />)

      expect(screen.getByText('DEV-FR')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Expand dev info'))

      await waitFor(() => {
        expect(screen.getByText('Authentification')).toBeInTheDocument()
        expect(screen.getByText('Base de données')).toBeInTheDocument()
      })
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
        expect(screen.getByText(/⎇ unknown/)).toBeInTheDocument()
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
        expect(screen.getByText('Not authenticated')).toBeInTheDocument()
      })
    })
  })
})
