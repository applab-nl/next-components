import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHasNewEntries } from './useHasNewEntries'

describe('useHasNewEntries', () => {
  const mockEntries = [
    { id: 'entry-1', date: '2024-01-15' },
    { id: 'entry-2', date: '2024-01-10' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('should return true when entries exist and no last visit', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: mockEntries }),
    })

    const { result } = renderHook(() => useHasNewEntries())

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should return false when no entries exist', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    })

    const { result } = renderHook(() => useHasNewEntries())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should return true when there are entries newer than last visit', async () => {
    localStorage.setItem(
      'nextstack-whats-new-last-visit',
      new Date('2024-01-12').toISOString()
    )

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: mockEntries }),
    })

    const { result } = renderHook(() => useHasNewEntries())

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should return false when all entries are older than last visit', async () => {
    localStorage.setItem(
      'nextstack-whats-new-last-visit',
      new Date('2024-01-20').toISOString()
    )

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: mockEntries }),
    })

    const { result } = renderHook(() => useHasNewEntries())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should return false on fetch error', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useHasNewEntries())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should use custom API endpoint', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEntries,
    })

    renderHook(() => useHasNewEntries('/custom/api'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/custom/api')
    })
  })

  it('should initially return false', () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: mockEntries }),
    })

    const { result } = renderHook(() => useHasNewEntries())

    // Initial state should be false before fetch completes
    expect(result.current).toBe(false)
  })
})
