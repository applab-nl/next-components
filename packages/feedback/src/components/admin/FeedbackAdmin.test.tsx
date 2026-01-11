import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FeedbackAdmin } from './FeedbackAdmin'
import type { Feedback, FeedbackStatus } from '../../types'

// Mock feedback for testing
function createMockFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'feedback-1',
    message: 'This is test feedback message',
    pageUrl: 'https://example.com/page',
    elementFriendlyName: null,
    elementCssSelector: null,
    elementXpath: null,
    elementTagName: null,
    screenshotUrl: null,
    userId: 'user-1',
    userEmail: 'user@example.com',
    userName: 'Test User',
    organizationId: 'org-1',
    isPublicSuggestion: false,
    voteScore: 0,
    status: 'pending',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    externalIssueId: null,
    externalIssueUrl: null,
    issueProvider: null,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    ...overrides,
  }
}

describe('FeedbackAdmin', () => {
  const mockFetchFeedback = vi.fn()
  const mockUpdateStatus = vi.fn()
  const mockTogglePublicSuggestion = vi.fn()
  const mockDeleteFeedback = vi.fn()

  const defaultProps = {
    fetchFeedback: mockFetchFeedback,
    updateStatus: mockUpdateStatus,
    togglePublicSuggestion: mockTogglePublicSuggestion,
    deleteFeedback: mockDeleteFeedback,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback()],
      total: 1,
    })
    mockUpdateStatus.mockImplementation(async (id, status) =>
      createMockFeedback({ id, status })
    )
    mockTogglePublicSuggestion.mockImplementation(async (id, isPublic) =>
      createMockFeedback({ id, isPublicSuggestion: isPublic })
    )
    mockDeleteFeedback.mockResolvedValue(undefined)
  })

  it('renders the component with title', () => {
    render(<FeedbackAdmin {...defaultProps} />)
    expect(screen.getByText('Feedback Management')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<FeedbackAdmin {...defaultProps} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays feedback after loading', async () => {
    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('This is test feedback message')).toBeInTheDocument()
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
  })

  it('shows no results message when empty', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [],
      total: 0,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('No feedback found')).toBeInTheDocument()
  })

  it('displays error message on fetch failure', async () => {
    mockFetchFeedback.mockRejectedValue(new Error('Network error'))

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<FeedbackAdmin {...defaultProps} />)
    expect(screen.getByPlaceholderText('Search feedback...')).toBeInTheDocument()
  })

  it('renders status filter dropdown', () => {
    render(<FeedbackAdmin {...defaultProps} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
  })

  it('shows all status options in dropdown', () => {
    render(<FeedbackAdmin {...defaultProps} />)

    const statuses = ['Pending', 'Reviewed', 'Resolved', 'Rejected']

    statuses.forEach(status => {
      expect(screen.getByRole('option', { name: status })).toBeInTheDocument()
    })
  })

  it('displays feedback with Pending status badge', async () => {
    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('Pending')).toBeInTheDocument()
  })

  it('shows public suggestion badge when isPublicSuggestion is true', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ isPublicSuggestion: true })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('Public')).toBeInTheDocument()
  })

  it('shows external issue link when present', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({
        externalIssueUrl: 'https://linear.app/issue/123',
        issueProvider: 'linear',
      })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('LINEAR')).toBeInTheDocument()
  })

  it('expands row when clicked', async () => {
    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Find and click the expandable row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText(/Click to add notes/)).toBeInTheDocument()
  })

  it('shows screenshot indicator when screenshotUrl is present', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ screenshotUrl: 'https://example.com/screenshot.png' })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('Screenshot')).toBeInTheDocument()
  })

  it('shows element indicator when elementFriendlyName is present', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ elementFriendlyName: 'Submit Button' })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('Submit Button')).toBeInTheDocument()
  })

  it('shows vote score when non-zero', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ voteScore: 5 })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    expect(await screen.findByText('5')).toBeInTheDocument()
  })

  it('uses custom date formatter', async () => {
    const customFormatter = vi.fn().mockReturnValue('Custom Date')

    render(<FeedbackAdmin {...defaultProps} formatDate={customFormatter} />)

    expect(await screen.findByText(/Custom Date/)).toBeInTheDocument()
    expect(customFormatter).toHaveBeenCalled()
  })

  it('supports custom translations', () => {
    render(
      <FeedbackAdmin
        {...defaultProps}
        translations={{
          title: 'Gestión de Comentarios',
          loading: 'Cargando...',
        }}
      />
    )

    expect(screen.getByText('Gestión de Comentarios')).toBeInTheDocument()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<FeedbackAdmin {...defaultProps} className="custom-class" />)

    const container = screen.getByText('Feedback Management').closest('div[class*="custom-class"]')
    expect(container).toBeInTheDocument()
  })

  it('shows pagination controls when there are multiple pages', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback()],
      total: 100,
    })

    render(<FeedbackAdmin {...defaultProps} defaultPageSize={25} />)

    expect(await screen.findByText('Page 1 of 4')).toBeInTheDocument()
  })

  it('shows create issue button when createIssue prop is provided', async () => {
    const mockCreateIssue = vi.fn().mockResolvedValue({ issueUrl: 'https://example.com/issue' })

    render(<FeedbackAdmin {...defaultProps} createIssue={mockCreateIssue} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('Create Issue')).toBeInTheDocument()
  })

  it('does not show create issue button when feedback already has external issue', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({
        externalIssueUrl: 'https://linear.app/issue/123',
        issueProvider: 'linear',
      })],
      total: 1,
    })

    const mockCreateIssue = vi.fn()

    render(<FeedbackAdmin {...defaultProps} createIssue={mockCreateIssue} />)

    const badge = await screen.findByText('LINEAR')

    // Expand the row
    const row = badge.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('View Issue')).toBeInTheDocument()
    expect(screen.queryByText('Create Issue')).not.toBeInTheDocument()
  })

  it('shows delete button in expanded row', async () => {
    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('Delete')).toBeInTheDocument()
  })

  it('shows make public button for private feedback', async () => {
    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('Make Public')).toBeInTheDocument()
  })

  it('shows make private button for public feedback', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ isPublicSuggestion: true })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('Make Private')).toBeInTheDocument()
  })

  it('displays admin notes when present', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ adminNotes: 'This is an admin note' })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('This is an admin note')).toBeInTheDocument()
  })

  it('displays page URL in expanded row', async () => {
    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('https://example.com/page')).toBeInTheDocument()
  })

  it('displays screenshot in expanded row when present', async () => {
    mockFetchFeedback.mockResolvedValue({
      items: [createMockFeedback({ screenshotUrl: 'https://example.com/screenshot.png' })],
      total: 1,
    })

    render(<FeedbackAdmin {...defaultProps} />)

    const message = await screen.findByText('This is test feedback message')

    // Expand the row
    const row = message.closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    const screenshot = await screen.findByAltText('Screenshot')
    expect(screenshot).toBeInTheDocument()
    expect(screenshot).toHaveAttribute('src', 'https://example.com/screenshot.png')
  })
})
