import type { PrismaClient } from '@prisma/client'
import type { AuthAdapter } from '@nextdevx/core'
import type { Feedback, FeedbackInput, FeedbackStatus } from '../types'

export interface FeedbackService {
  /** Submit new feedback */
  submitFeedback(input: FeedbackInput & { screenshotUrl?: string }): Promise<Feedback>
  /** Get current user's feedback */
  getMyFeedback(): Promise<Feedback[]>
  /** Get public suggestions */
  getSuggestions(params: {
    page?: number
    limit?: number
    sortBy?: 'votes' | 'newest'
  }): Promise<{ items: Feedback[]; total: number }>
  /** Vote on a suggestion */
  vote(feedbackId: string, voteType: 'up' | 'down' | null): Promise<number>
  /** Get feedback by ID */
  getFeedbackById(id: string): Promise<Feedback | null>
}

export interface AdminFeedbackService extends FeedbackService {
  /** Get all feedback (admin) */
  getAllFeedback(params: {
    page?: number
    limit?: number
    status?: FeedbackStatus
    search?: string
  }): Promise<{ items: Feedback[]; total: number }>
  /** Update feedback status */
  updateStatus(id: string, status: FeedbackStatus, adminNotes?: string): Promise<Feedback>
  /** Toggle public suggestion */
  togglePublicSuggestion(id: string, isPublic: boolean): Promise<Feedback>
  /** Delete feedback */
  deleteFeedback(id: string): Promise<void>
}

/**
 * Create feedback service instance
 *
 * @example
 * ```ts
 * const feedbackService = createFeedbackService(prisma, auth, {
 *   multiTenancy: { enabled: true, getOrganizationId }
 * })
 * ```
 */
export function createFeedbackService(
  prisma: PrismaClient,
  auth: AuthAdapter,
  options?: {
    multiTenancy?: {
      enabled: boolean
      getOrganizationId: () => Promise<string | null>
    }
  }
): FeedbackService {
  const getOrgId = async () => {
    if (options?.multiTenancy?.enabled) {
      return options.multiTenancy.getOrganizationId()
    }
    return null
  }

  return {
    async submitFeedback(input): Promise<Feedback> {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')

      const orgId = await getOrgId()

      const feedback = await (prisma as any).feedback.create({
        data: {
          message: input.message,
          pageUrl: input.pageUrl,
          elementFriendlyName: input.element?.friendlyName,
          elementCssSelector: input.element?.cssSelector,
          elementXpath: input.element?.xpath,
          elementTagName: input.element?.tagName,
          screenshotUrl: input.screenshotUrl,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          organizationId: orgId,
        },
      })

      return feedback as Feedback
    },

    async getMyFeedback(): Promise<Feedback[]> {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')

      const feedback = await (prisma as any).feedback.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      return feedback as Feedback[]
    },

    async getSuggestions(params): Promise<{ items: Feedback[]; total: number }> {
      const user = await auth.getCurrentUser()
      const orgId = await getOrgId()

      const where: any = {
        isPublicSuggestion: true,
        ...(orgId && { organizationId: orgId }),
      }

      const [items, total] = await Promise.all([
        (prisma as any).feedback.findMany({
          where,
          orderBy:
            params.sortBy === 'votes'
              ? { voteScore: 'desc' }
              : { createdAt: 'desc' },
          skip: ((params.page ?? 1) - 1) * (params.limit ?? 10),
          take: params.limit ?? 10,
          include: {
            votes: user
              ? {
                  where: { userId: user.id },
                  select: { voteType: true },
                }
              : false,
          },
        }),
        (prisma as any).feedback.count({ where }),
      ])

      // Map current user's vote
      const mappedItems = items.map((item: any) => ({
        ...item,
        currentUserVote: item.votes?.[0]?.voteType ?? null,
        votes: undefined,
      }))

      return { items: mappedItems as Feedback[], total }
    },

    async vote(feedbackId, voteType): Promise<number> {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')

      // Get current feedback
      const feedback = await (prisma as any).feedback.findUnique({
        where: { id: feedbackId },
      })
      if (!feedback) throw new Error('Feedback not found')
      if (feedback.userId === user.id) {
        throw new Error('Cannot vote on your own feedback')
      }

      // Get existing vote
      const existingVote = await (prisma as any).feedbackVote.findUnique({
        where: {
          feedbackId_userId: { feedbackId, userId: user.id },
        },
      })

      let scoreChange = 0

      if (voteType === null) {
        // Remove vote
        if (existingVote) {
          await (prisma as any).feedbackVote.delete({
            where: { id: existingVote.id },
          })
          scoreChange = existingVote.voteType === 'up' ? -1 : 1
        }
      } else if (existingVote) {
        // Update vote
        if (existingVote.voteType !== voteType) {
          await (prisma as any).feedbackVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          })
          scoreChange = voteType === 'up' ? 2 : -2
        }
      } else {
        // Create vote
        await (prisma as any).feedbackVote.create({
          data: { feedbackId, userId: user.id, voteType },
        })
        scoreChange = voteType === 'up' ? 1 : -1
      }

      // Update score
      const updated = await (prisma as any).feedback.update({
        where: { id: feedbackId },
        data: { voteScore: { increment: scoreChange } },
      })

      return updated.voteScore
    },

    async getFeedbackById(id): Promise<Feedback | null> {
      const feedback = await (prisma as any).feedback.findUnique({
        where: { id },
      })
      return feedback as Feedback | null
    },
  }
}
