import type { PrismaClient } from '@prisma/client'
import type { AuthAdapter } from '@nextstack/core'
import type { WhatsNewEntry } from '../types'

export interface WhatsNewService {
  getEntries(): Promise<WhatsNewEntry[]>
  vote(entryId: string, voteType: 'up' | 'down' | null): Promise<{
    upvotes: number
    downvotes: number
  }>
}

export function createWhatsNewService(
  prisma: PrismaClient,
  auth: AuthAdapter
): WhatsNewService {
  return {
    async getEntries(): Promise<WhatsNewEntry[]> {
      const user = await auth.getCurrentUser()

      const entries = await (prisma as any).whatsNewEntry.findMany({
        where: { isPublished: true },
        orderBy: { date: 'desc' },
        include: {
          _count: { select: { linkedFeedback: true } },
          votes: user ? { where: { userId: user.id } } : false,
        },
      })

      return entries.map((entry: any) => ({
        ...entry,
        linkedFeedbackCount: entry._count?.linkedFeedback ?? 0,
        currentUserVote: entry.votes?.[0]?.voteType ?? null,
        _count: undefined,
        votes: undefined,
      }))
    },

    async vote(entryId, voteType) {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')

      const existingVote = await (prisma as any).whatsNewVote.findUnique({
        where: { entryId_userId: { entryId, userId: user.id } },
      })

      let upChange = 0
      let downChange = 0

      if (voteType === null && existingVote) {
        // Remove vote
        await (prisma as any).whatsNewVote.delete({ where: { id: existingVote.id } })
        if (existingVote.voteType === 'up') upChange = -1
        else downChange = -1
      } else if (existingVote) {
        // Update vote
        if (existingVote.voteType !== voteType) {
          await (prisma as any).whatsNewVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          })
          if (voteType === 'up') {
            upChange = 1
            downChange = -1
          } else {
            upChange = -1
            downChange = 1
          }
        }
      } else if (voteType) {
        // Create vote
        await (prisma as any).whatsNewVote.create({
          data: { entryId, userId: user.id, voteType },
        })
        if (voteType === 'up') upChange = 1
        else downChange = 1
      }

      const updated = await (prisma as any).whatsNewEntry.update({
        where: { id: entryId },
        data: {
          upvotes: { increment: upChange },
          downvotes: { increment: downChange },
        },
      })

      return { upvotes: updated.upvotes, downvotes: updated.downvotes }
    },
  }
}
