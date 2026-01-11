export interface WhatsNewEntry {
  id: string
  date: Date
  title: string
  summary: string
  content: string | null
  isPublished: boolean
  upvotes: number
  downvotes: number
  linkedFeedbackCount?: number
  createdAt: Date
  updatedAt: Date
  /** Current user's vote */
  currentUserVote?: 'up' | 'down' | null
}

export interface WhatsNewVote {
  id: string
  entryId: string
  userId: string
  voteType: 'up' | 'down'
  createdAt: Date
}

export interface WhatsNewFeedbackLink {
  id: string
  entryId: string
  feedbackId: string
  createdAt: Date
}
