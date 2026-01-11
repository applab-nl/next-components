import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WhatsNewBadge } from './WhatsNewBadge'
import * as useHasNewEntriesModule from '../hooks/useHasNewEntries'

// Mock the hook
vi.mock('../hooks/useHasNewEntries')

describe('WhatsNewBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render badge when there are new entries', () => {
    vi.spyOn(useHasNewEntriesModule, 'useHasNewEntries').mockReturnValue(true)

    render(<WhatsNewBadge />)

    const badge = screen.getByLabelText('New updates available')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-600')
  })

  it('should not render when there are no new entries', () => {
    vi.spyOn(useHasNewEntriesModule, 'useHasNewEntries').mockReturnValue(false)

    render(<WhatsNewBadge />)

    expect(screen.queryByLabelText('New updates available')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    vi.spyOn(useHasNewEntriesModule, 'useHasNewEntries').mockReturnValue(true)

    render(<WhatsNewBadge className="custom-class" />)

    const badge = screen.getByLabelText('New updates available')
    expect(badge).toHaveClass('custom-class')
  })

  it('should have correct default styles', () => {
    vi.spyOn(useHasNewEntriesModule, 'useHasNewEntries').mockReturnValue(true)

    render(<WhatsNewBadge />)

    const badge = screen.getByLabelText('New updates available')
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('h-2')
    expect(badge).toHaveClass('w-2')
    expect(badge).toHaveClass('rounded-full')
  })

  it('should have displayName set', () => {
    expect(WhatsNewBadge.displayName).toBe('WhatsNewBadge')
  })
})
