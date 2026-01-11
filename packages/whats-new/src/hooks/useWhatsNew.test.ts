import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWhatsNew } from './useWhatsNew'

describe('useWhatsNew', () => {
  const mockEntries = [
    {
      id: 'entry-1',
      title: 'New Feature',
      summary: 'A new feature',
      date: '2024-01-15',
      upvotes: 5,
      downvotes: 1,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch entries on mount', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: mockEntries }),
    })

    const { result } = renderHook(() => useWhatsNew())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entries).toEqual(mockEntries)
    expect(result.current.error).toBeNull()
    expect(global.fetch).toHaveBeenCalledWith('/api/whats-new')
  })

  it('should use custom API endpoint', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEntries,
    })

    renderHook(() => useWhatsNew('/custom/api'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/custom/api')
    })
  })

  it('should set error on fetch failure', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useWhatsNew())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch entries')
    expect(result.current.entries).toEqual([])
  })

  it('should set error on network failure', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useWhatsNew())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should refetch entries when refetch is called', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: mockEntries }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entries: [...mockEntries, { id: 'entry-2', title: 'Another Feature' }],
        }),
      })

    const { result } = renderHook(() => useWhatsNew())

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1)
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.entries).toHaveLength(2)
  })

  describe('vote', () => {
    it('should send vote request and update entry', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: mockEntries }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ upvotes: 6, downvotes: 1 }),
        })

      const { result } = renderHook(() => useWhatsNew())

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      await act(async () => {
        await result.current.vote('entry-1', 'up')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/whats-new/entry-1/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: 'up' }),
      })

      expect(result.current.entries[0].upvotes).toBe(6)
      expect(result.current.entries[0].currentUserVote).toBe('up')
    })

    it('should handle vote for downvote', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: mockEntries }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ upvotes: 5, downvotes: 2 }),
        })

      const { result } = renderHook(() => useWhatsNew())

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      await act(async () => {
        await result.current.vote('entry-1', 'down')
      })

      expect(result.current.entries[0].downvotes).toBe(2)
      expect(result.current.entries[0].currentUserVote).toBe('down')
    })

    it('should handle vote removal (null)', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: mockEntries }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ upvotes: 4, downvotes: 1 }),
        })

      const { result } = renderHook(() => useWhatsNew())

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      await act(async () => {
        await result.current.vote('entry-1', null)
      })

      expect(result.current.entries[0].upvotes).toBe(4)
      expect(result.current.entries[0].currentUserVote).toBeNull()
    })

    it('should set error on vote failure', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: mockEntries }),
        })
        .mockResolvedValueOnce({
          ok: false,
        })

      const { result } = renderHook(() => useWhatsNew())

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      // The new implementation re-throws the error after setting state
      await act(async () => {
        await expect(result.current.vote('entry-1', 'up')).rejects.toThrow('Failed to vote')
      })

      expect(result.current.error).toBe('Failed to vote')
    })
  })
})
