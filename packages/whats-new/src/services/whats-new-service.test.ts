import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWhatsNewService } from './whats-new-service'

describe('createWhatsNewService', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' }

  const mockAuth = {
    getCurrentUser: vi.fn(),
  }

  const mockPrisma = {
    whatsNewEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    whatsNewVote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getCurrentUser.mockResolvedValue(mockUser)
  })

  describe('getEntries', () => {
    it('should fetch published entries ordered by date descending', async () => {
      const entries = [
        {
          id: 'entry-1',
          title: 'New Feature',
          summary: 'A new feature',
          date: new Date('2024-01-15'),
          isPublished: true,
          upvotes: 5,
          downvotes: 1,
          _count: { linkedFeedback: 2 },
          votes: [{ voteType: 'up' }],
        },
      ]
      mockPrisma.whatsNewEntry.findMany.mockResolvedValue(entries)

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      const result = await service.getEntries()

      expect(mockPrisma.whatsNewEntry.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { date: 'desc' },
        include: {
          _count: { select: { linkedFeedback: true } },
          votes: { where: { userId: mockUser.id } },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'entry-1',
        title: 'New Feature',
        linkedFeedbackCount: 2,
        currentUserVote: 'up',
      })
      // The _count field is set to undefined (not deleted) so we check its value
      expect(result[0]._count).toBeUndefined()
    })

    it('should handle unauthenticated users', async () => {
      mockAuth.getCurrentUser.mockResolvedValue(null)
      const entries = [
        {
          id: 'entry-1',
          title: 'New Feature',
          _count: { linkedFeedback: 0 },
        },
      ]
      mockPrisma.whatsNewEntry.findMany.mockResolvedValue(entries)

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      const result = await service.getEntries()

      expect(mockPrisma.whatsNewEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            votes: false,
          }),
        })
      )
      expect(result[0].currentUserVote).toBeNull()
    })

    it('should return empty array when no entries exist', async () => {
      mockPrisma.whatsNewEntry.findMany.mockResolvedValue([])

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      const result = await service.getEntries()

      expect(result).toEqual([])
    })
  })

  describe('vote', () => {
    it('should throw error when user is not authenticated', async () => {
      mockAuth.getCurrentUser.mockResolvedValue(null)

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)

      await expect(service.vote('entry-1', 'up')).rejects.toThrow('Unauthorized')
    })

    it('should create a new upvote', async () => {
      // Mock entry exists check
      mockPrisma.whatsNewEntry.findUnique
        .mockResolvedValueOnce({ id: 'entry-1', upvotes: 0, downvotes: 0 }) // Entry check
        .mockResolvedValueOnce({ upvotes: 1, downvotes: 0 }) // Final count fetch
      mockPrisma.whatsNewVote.findUnique.mockResolvedValue(null)
      mockPrisma.whatsNewEntry.update.mockResolvedValue({ upvotes: 1, downvotes: 0 })

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      const result = await service.vote('entry-1', 'up')

      expect(mockPrisma.whatsNewVote.create).toHaveBeenCalledWith({
        data: { entryId: 'entry-1', userId: mockUser.id, voteType: 'up' },
      })
      expect(mockPrisma.whatsNewEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { upvotes: { increment: 1 }, downvotes: { increment: 0 } },
      })
      expect(result).toEqual({ upvotes: 1, downvotes: 0 })
    })

    it('should create a new downvote', async () => {
      mockPrisma.whatsNewEntry.findUnique
        .mockResolvedValueOnce({ id: 'entry-1', upvotes: 0, downvotes: 0 })
        .mockResolvedValueOnce({ upvotes: 0, downvotes: 1 })
      mockPrisma.whatsNewVote.findUnique.mockResolvedValue(null)
      mockPrisma.whatsNewEntry.update.mockResolvedValue({ upvotes: 0, downvotes: 1 })

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      await service.vote('entry-1', 'down')

      expect(mockPrisma.whatsNewVote.create).toHaveBeenCalledWith({
        data: { entryId: 'entry-1', userId: mockUser.id, voteType: 'down' },
      })
      expect(mockPrisma.whatsNewEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { upvotes: { increment: 0 }, downvotes: { increment: 1 } },
      })
    })

    it('should remove an existing vote when voteType is null', async () => {
      mockPrisma.whatsNewEntry.findUnique
        .mockResolvedValueOnce({ id: 'entry-1', upvotes: 1, downvotes: 0 })
        .mockResolvedValueOnce({ upvotes: 0, downvotes: 0 })
      mockPrisma.whatsNewVote.findUnique.mockResolvedValue({
        id: 'vote-1',
        voteType: 'up',
      })
      mockPrisma.whatsNewEntry.update.mockResolvedValue({ upvotes: 0, downvotes: 0 })

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      await service.vote('entry-1', null)

      expect(mockPrisma.whatsNewVote.delete).toHaveBeenCalledWith({
        where: { id: 'vote-1' },
      })
      expect(mockPrisma.whatsNewEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { upvotes: { increment: -1 }, downvotes: { increment: 0 } },
      })
    })

    it('should change vote from up to down', async () => {
      mockPrisma.whatsNewEntry.findUnique
        .mockResolvedValueOnce({ id: 'entry-1', upvotes: 1, downvotes: 0 })
        .mockResolvedValueOnce({ upvotes: 0, downvotes: 1 })
      mockPrisma.whatsNewVote.findUnique.mockResolvedValue({
        id: 'vote-1',
        voteType: 'up',
      })
      mockPrisma.whatsNewEntry.update.mockResolvedValue({ upvotes: 0, downvotes: 1 })

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      await service.vote('entry-1', 'down')

      expect(mockPrisma.whatsNewVote.update).toHaveBeenCalledWith({
        where: { id: 'vote-1' },
        data: { voteType: 'down' },
      })
      expect(mockPrisma.whatsNewEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { upvotes: { increment: -1 }, downvotes: { increment: 1 } },
      })
    })

    it('should change vote from down to up', async () => {
      mockPrisma.whatsNewEntry.findUnique
        .mockResolvedValueOnce({ id: 'entry-1', upvotes: 0, downvotes: 1 })
        .mockResolvedValueOnce({ upvotes: 1, downvotes: 0 })
      mockPrisma.whatsNewVote.findUnique.mockResolvedValue({
        id: 'vote-1',
        voteType: 'down',
      })
      mockPrisma.whatsNewEntry.update.mockResolvedValue({ upvotes: 1, downvotes: 0 })

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      await service.vote('entry-1', 'up')

      expect(mockPrisma.whatsNewVote.update).toHaveBeenCalledWith({
        where: { id: 'vote-1' },
        data: { voteType: 'up' },
      })
      expect(mockPrisma.whatsNewEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { upvotes: { increment: 1 }, downvotes: { increment: -1 } },
      })
    })

    it('should not change anything when voting same as existing', async () => {
      mockPrisma.whatsNewEntry.findUnique
        .mockResolvedValueOnce({ id: 'entry-1', upvotes: 1, downvotes: 0 })
        .mockResolvedValueOnce({ upvotes: 1, downvotes: 0 })
      mockPrisma.whatsNewVote.findUnique.mockResolvedValue({
        id: 'vote-1',
        voteType: 'up',
      })

      const service = createWhatsNewService(mockPrisma as any, mockAuth as any)
      const result = await service.vote('entry-1', 'up')

      // When voting same as existing, no mutations should happen
      expect(mockPrisma.whatsNewVote.create).not.toHaveBeenCalled()
      expect(mockPrisma.whatsNewVote.update).not.toHaveBeenCalled()
      expect(mockPrisma.whatsNewVote.delete).not.toHaveBeenCalled()
      expect(mockPrisma.whatsNewEntry.update).not.toHaveBeenCalled()
      // Should still return current counts
      expect(result).toEqual({ upvotes: 1, downvotes: 0 })
    })
  })
})
