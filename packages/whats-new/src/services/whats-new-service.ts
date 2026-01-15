import type { PrismaClient } from '@prisma/client'
import type { AuthAdapter } from '@nextdevx/core'
import type { WhatsNewEntry } from '../types'

export interface WhatsNewService {
  /** Get all published entries */
  getEntries(): Promise<WhatsNewEntry[]>
  /** Vote on an entry */
  vote(
    entryId: string,
    voteType: 'up' | 'down' | null
  ): Promise<{
    upvotes: number
    downvotes: number
  }>
  /** Create a new entry (admin only) */
  createEntry?(input: CreateEntryInput): Promise<WhatsNewEntry>
}

export interface CreateEntryInput {
  date: string // YYYY-MM-DD format
  title: string
  summary: string
  content?: string
  isPublished?: boolean
}

export interface WhatsNewServiceOptions {
  /**
   * Enable vote propagation to linked feedback items.
   * When enabled, votes on What's New entries will also update
   * the voteScore of linked feedback items and their authors' feedbackScore.
   */
  enableVotePropagation?: boolean
}

/**
 * Create a What's New service instance
 *
 * @example
 * ```ts
 * const whatsNewService = createWhatsNewService(prisma, auth, {
 *   enableVotePropagation: true
 * })
 * ```
 */
export function createWhatsNewService(
  prisma: PrismaClient,
  auth: AuthAdapter,
  options?: WhatsNewServiceOptions
): WhatsNewService {
  const { enableVotePropagation = false } = options ?? {}

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

      // Verify entry exists
      const entry = await (prisma as any).whatsNewEntry.findUnique({
        where: { id: entryId },
        select: { id: true, upvotes: true, downvotes: true },
      })

      if (!entry) throw new Error('Entry not found')

      // Get existing vote
      const existingVote = await (prisma as any).whatsNewVote.findUnique({
        where: { entryId_userId: { entryId, userId: user.id } },
      })

      let upChange = 0
      let downChange = 0
      let scoreChange = 0 // For vote propagation

      if (voteType === null && existingVote) {
        // Remove vote
        upChange = existingVote.voteType === 'up' ? -1 : 0
        downChange = existingVote.voteType === 'down' ? -1 : 0
        scoreChange = existingVote.voteType === 'up' ? -1 : 1

        if (enableVotePropagation) {
          // Use transaction for atomicity when propagating votes
          await (prisma as any).$transaction(async (tx: any) => {
            await tx.whatsNewVote.delete({ where: { id: existingVote.id } })
            await tx.whatsNewEntry.update({
              where: { id: entryId },
              data: {
                upvotes: { increment: upChange },
                downvotes: { increment: downChange },
              },
            })
            await applyVotePropagation(tx, entryId, scoreChange)
          })
        } else {
          await (prisma as any).whatsNewVote.delete({ where: { id: existingVote.id } })
          await (prisma as any).whatsNewEntry.update({
            where: { id: entryId },
            data: {
              upvotes: { increment: upChange },
              downvotes: { increment: downChange },
            },
          })
        }
      } else if (existingVote && existingVote.voteType !== voteType) {
        // Change vote
        if (voteType === 'up') {
          upChange = 1
          downChange = -1
          scoreChange = 2 // Reverse -1, apply +1
        } else {
          upChange = -1
          downChange = 1
          scoreChange = -2 // Reverse +1, apply -1
        }

        if (enableVotePropagation) {
          await (prisma as any).$transaction(async (tx: any) => {
            await tx.whatsNewVote.update({
              where: { id: existingVote.id },
              data: { voteType },
            })
            await tx.whatsNewEntry.update({
              where: { id: entryId },
              data: {
                upvotes: { increment: upChange },
                downvotes: { increment: downChange },
              },
            })
            await applyVotePropagation(tx, entryId, scoreChange)
          })
        } else {
          await (prisma as any).whatsNewVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          })
          await (prisma as any).whatsNewEntry.update({
            where: { id: entryId },
            data: {
              upvotes: { increment: upChange },
              downvotes: { increment: downChange },
            },
          })
        }
      } else if (voteType && !existingVote) {
        // Create new vote
        upChange = voteType === 'up' ? 1 : 0
        downChange = voteType === 'down' ? 1 : 0
        scoreChange = voteType === 'up' ? 1 : -1

        if (enableVotePropagation) {
          await (prisma as any).$transaction(async (tx: any) => {
            await tx.whatsNewVote.create({
              data: { entryId, userId: user.id, voteType },
            })
            await tx.whatsNewEntry.update({
              where: { id: entryId },
              data: {
                upvotes: { increment: upChange },
                downvotes: { increment: downChange },
              },
            })
            await applyVotePropagation(tx, entryId, scoreChange)
          })
        } else {
          await (prisma as any).whatsNewVote.create({
            data: { entryId, userId: user.id, voteType },
          })
          await (prisma as any).whatsNewEntry.update({
            where: { id: entryId },
            data: {
              upvotes: { increment: upChange },
              downvotes: { increment: downChange },
            },
          })
        }
      }

      // Fetch updated counts
      const updated = await (prisma as any).whatsNewEntry.findUnique({
        where: { id: entryId },
        select: { upvotes: true, downvotes: true },
      })

      return { upvotes: updated?.upvotes ?? 0, downvotes: updated?.downvotes ?? 0 }
    },

    async createEntry(input: CreateEntryInput): Promise<WhatsNewEntry> {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')

      // Convert date string to Date object (set to noon UTC to avoid timezone issues)
      const entryDate = new Date(`${input.date}T12:00:00.000Z`)

      const entry = await (prisma as any).whatsNewEntry.create({
        data: {
          date: entryDate,
          title: input.title,
          summary: input.summary,
          content: input.content,
          isPublished: input.isPublished ?? true,
          createdBy: user.id,
        },
      })

      return {
        ...entry,
        linkedFeedbackCount: 0,
        currentUserVote: null,
      }
    },
  }
}

/**
 * Applies vote propagation to linked feedback within a transaction context.
 *
 * Vote Propagation Logic:
 * When a user votes on a What's New entry, the vote also affects:
 * 1. Each linked feedback item's voteScore
 * 2. Each feedback author's feedbackScore
 *
 * Score Changes:
 * - New upvote: +1 to all linked feedback and authors
 * - New downvote: -1 to all linked feedback and authors
 * - Remove upvote: -1 (reverses the +1)
 * - Remove downvote: +1 (reverses the -1)
 * - Change UP→DOWN: -2 (reverse +1, apply -1)
 * - Change DOWN→UP: +2 (reverse -1, apply +1)
 */
async function applyVotePropagation(
  tx: any,
  entryId: string,
  scoreChange: number
): Promise<void> {
  // Check if the model exists (not all apps may have this relationship)
  try {
    // Query linked feedback within the transaction
    const links = await tx.whatsNewFeedbackLink.findMany({
      where: { entryId },
      include: {
        feedback: {
          select: { id: true, userId: true },
        },
      },
    })

    if (links.length === 0) return

    // Track accumulated score changes per user
    const userUpdates: Map<string, number> = new Map()

    // Update each linked feedback's voteScore
    for (const link of links) {
      await tx.feedback.update({
        where: { id: link.feedbackId },
        data: { voteScore: { increment: scoreChange } },
      })

      // Accumulate score changes for feedback authors
      const currentScore = userUpdates.get(link.feedback.userId) || 0
      userUpdates.set(link.feedback.userId, currentScore + scoreChange)
    }

    // Update user feedbackScores
    for (const [userId, delta] of userUpdates) {
      await tx.user.update({
        where: { id: userId },
        data: { feedbackScore: { increment: delta } },
      })
    }
  } catch {
    // Model doesn't exist or query failed - skip propagation
    // This allows the service to work even if linked feedback isn't set up
  }
}
