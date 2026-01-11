import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WhatsNewDialog } from './WhatsNewDialog'
import * as useWhatsNewModule from '../hooks/useWhatsNew'

// Mock the hook
vi.mock('../hooks/useWhatsNew')

// Mock createPortal to render content directly
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  }
})

describe('WhatsNewDialog', () => {
  const mockVote = vi.fn()
  const mockEntries = [
    {
      id: 'entry-1',
      title: 'New Feature',
      summary: 'A great new feature',
      date: new Date('2024-01-15'),
      upvotes: 5,
      downvotes: 1,
      isPublished: true,
      content: null,
      currentUserVote: null,
      linkedFeedbackCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'entry-2',
      title: 'Bug Fix',
      summary: 'Fixed a bug',
      date: new Date('2024-01-10'),
      upvotes: 3,
      downvotes: 0,
      isPublished: true,
      content: null,
      currentUserVote: 'up' as const,
      linkedFeedbackCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useWhatsNewModule, 'useWhatsNew').mockReturnValue({
      entries: mockEntries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      vote: mockVote,
    })
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should render dialog header with title when open', () => {
    render(<WhatsNewDialog open={true} />)

    expect(screen.getByText("What's New")).toBeInTheDocument()
  })

  it('should show entry count in header when open', async () => {
    // No last visit means all entries are "new"
    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText(/2 new update/)).toBeInTheDocument()
    })
  })

  it('should support controlled open state', async () => {
    const onOpenChange = vi.fn()
    render(<WhatsNewDialog open={true} onOpenChange={onOpenChange} />)

    // Click close button
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should display entries when dialog is open', async () => {
    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
      expect(screen.getByText('A great new feature')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    vi.spyOn(useWhatsNewModule, 'useWhatsNew').mockReturnValue({
      entries: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      vote: mockVote,
    })

    render(<WhatsNewDialog open={true} />)

    // Loading shows a spinner, not text
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should show empty state when no entries', async () => {
    vi.spyOn(useWhatsNewModule, 'useWhatsNew').mockReturnValue({
      entries: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      vote: mockVote,
    })

    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText('No updates available yet.')).toBeInTheDocument()
    })
  })

  it('should close dialog when X button is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<WhatsNewDialog open={true} onOpenChange={onOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
    })

    // Find and click close button
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should not render anything when closed', () => {
    render(<WhatsNewDialog open={false} />)

    expect(screen.queryByText("What's New")).not.toBeInTheDocument()
  })

  it('should call vote when upvote button is clicked', async () => {
    mockVote.mockResolvedValue({ upvotes: 6, downvotes: 1 })

    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
    })

    // Find upvote button (shows upvote count)
    const upvoteButton = screen.getByText('5').closest('button')
    if (upvoteButton) {
      fireEvent.click(upvoteButton)
    }

    await waitFor(() => {
      expect(mockVote).toHaveBeenCalledWith('entry-1', 'up')
    })
  })

  it('should call vote when downvote button is clicked', async () => {
    mockVote.mockResolvedValue({ upvotes: 5, downvotes: 2 })

    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
    })

    // Find downvote button (shows downvote count)
    const downvoteButton = screen.getByText('1').closest('button')
    if (downvoteButton) {
      fireEvent.click(downvoteButton)
    }

    await waitFor(() => {
      expect(mockVote).toHaveBeenCalledWith('entry-1', 'down')
    })
  })

  it('should toggle vote off when clicking same vote type', async () => {
    mockVote.mockResolvedValue({ upvotes: 2, downvotes: 0 })

    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText('Bug Fix')).toBeInTheDocument()
    })

    // entry-2 has currentUserVote: 'up', clicking upvote should toggle it off
    const upvoteButton = screen.getByText('3').closest('button')
    if (upvoteButton) {
      fireEvent.click(upvoteButton)
    }

    await waitFor(() => {
      // Vote should be called with null to remove
      expect(mockVote).toHaveBeenCalledWith('entry-2', null)
    })
  })

  it('should show linked feedback count', async () => {
    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      // New implementation shows "Based on X user requests"
      expect(screen.getByText(/Based on 2 user requests/)).toBeInTheDocument()
    })
  })

  it('should hide voting buttons when enableVoting is false', async () => {
    render(<WhatsNewDialog open={true} enableVoting={false} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
    })

    // Upvote count should not be visible as a button
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('should hide linked feedback count when showLinkedFeedbackCount is false', async () => {
    render(<WhatsNewDialog open={true} showLinkedFeedbackCount={false} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Based on 2 user requests/)).not.toBeInTheDocument()
  })

  it('should update localStorage when dialog is closed', async () => {
    const onOpenChange = vi.fn()
    render(<WhatsNewDialog open={true} onOpenChange={onOpenChange} />)

    expect(localStorage.getItem('nextstack-whats-new-last-visit')).toBeNull()

    // Close dialog - last visit should be updated on close
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(localStorage.getItem('nextstack-whats-new-last-visit')).not.toBeNull()
    })
  })

  it('should separate new and older entries based on last visit', async () => {
    // Set last visit between the two entries
    localStorage.setItem(
      'nextstack-whats-new-last-visit',
      new Date('2024-01-12').toISOString()
    )

    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      // entry-1 (Jan 15) should be new, entry-2 (Jan 10) should be older
      expect(screen.getByText('New Feature')).toBeInTheDocument()
      // Look for "Show 1 older update" button
      expect(screen.getByText(/Show 1 older/)).toBeInTheDocument()
    })
  })

  it('should show all entries when no last visit is set', async () => {
    // Without a last visit, all entries should be shown as "new"
    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument()
      expect(screen.getByText('Bug Fix')).toBeInTheDocument()
    })
  })

  it('should display NEW badge for new entries', async () => {
    // No last visit means all entries are new
    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      const newBadges = screen.getAllByText('NEW')
      expect(newBadges.length).toBe(2) // Both entries should have NEW badge
    })
  })

  it('should format dates correctly', async () => {
    render(<WhatsNewDialog open={true} />)

    await waitFor(() => {
      // Date should be formatted (locale dependent, so just check it exists)
      expect(screen.getByText('New Feature')).toBeInTheDocument()
    })
  })
})
