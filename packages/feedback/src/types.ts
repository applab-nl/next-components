/**
 * Element information captured by the element picker
 */
export interface ElementInfo {
  /** Human-readable element name */
  friendlyName: string
  /** CSS selector for the element */
  cssSelector: string
  /** XPath to the element */
  xpath: string
  /** HTML tag name (lowercase) */
  tagName: string
}

/**
 * Feedback input from user
 */
export interface FeedbackInput {
  /** Feedback message */
  message: string
  /** Page URL where feedback was submitted */
  pageUrl: string
  /** Selected element info (optional) */
  element?: ElementInfo
  /** Screenshot blob (optional) */
  screenshot?: Blob
}

/**
 * Feedback record from database
 */
export interface Feedback {
  id: string
  message: string
  pageUrl: string
  elementFriendlyName: string | null
  elementCssSelector: string | null
  elementXpath: string | null
  elementTagName: string | null
  screenshotUrl: string | null
  userId: string
  userEmail: string
  userName: string | null
  organizationId: string | null
  isPublicSuggestion: boolean
  voteScore: number
  status: FeedbackStatus
  adminNotes: string | null
  reviewedBy: string | null
  reviewedAt: Date | null
  externalIssueId: string | null
  externalIssueUrl: string | null
  issueProvider: IssueProvider | null
  createdAt: Date
  updatedAt: Date
  /** Current user's vote (if fetched with user context) */
  currentUserVote?: 'up' | 'down' | null
}

export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected'
export type IssueProvider = 'linear' | 'jira' | 'github'

/**
 * Feedback vote record
 */
export interface FeedbackVote {
  id: string
  feedbackId: string
  userId: string
  voteType: 'up' | 'down'
  createdAt: Date
}

/**
 * Configuration for the feedback system
 */
export interface FeedbackConfig {
  /** Enable element picker (default: true) */
  enableElementPicker?: boolean
  /** Enable screenshot capture (default: true) */
  enableScreenshots?: boolean
  /** Maximum message length (default: 2000) */
  maxMessageLength?: number
  /** Screenshot quality 0-1 (default: 0.8) */
  screenshotQuality?: number
  /** API endpoint (default: /api/feedback) */
  apiEndpoint?: string
  /** Screenshot upload endpoint (default: /api/feedback/upload) */
  uploadEndpoint?: string
}

/**
 * Issue tracker configuration
 */
export interface IssueTrackerConfig {
  provider: IssueProvider
  isEnabled: boolean
  // Linear
  linearApiKey?: string
  linearTeamId?: string
  linearDefaultLabels?: string[]
  // Jira
  jiraHost?: string
  jiraEmail?: string
  jiraApiToken?: string
  jiraProjectKey?: string
  jiraIssueType?: string
  jiraDefaultLabels?: string[]
  // GitHub
  githubToken?: string
  githubRepo?: string
  githubDefaultLabels?: string[]
}
