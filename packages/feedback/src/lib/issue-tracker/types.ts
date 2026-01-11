/**
 * Types for issue tracker integrations
 */

export type IssueTrackerProvider = 'linear' | 'jira' | 'github'

export interface CreateIssueResult {
  success: boolean
  issueId?: string
  issueKey?: string
  issueUrl?: string
  error?: string
}

export interface TestConnectionResult {
  success: boolean
  error?: string
}

export interface FeedbackData {
  id: string
  message: string
  pageUrl: string
  elementFriendlyName?: string | null
  elementTagName?: string | null
  elementCssSelector?: string | null
  elementXpath?: string | null
  screenshotUrl?: string | null
  userEmail?: string
  userName?: string | null
  createdAt: Date | string
}

export interface LinearConfig {
  apiKey: string
  teamId: string
  defaultLabels?: string[]
}

export interface JiraConfig {
  host: string
  email: string
  apiToken: string
  projectKey: string
  issueType?: string
  defaultLabels?: string[]
}

export interface GitHubConfig {
  token: string
  repo: string // format: owner/repo
  defaultLabels?: string[]
}

export interface IssueTrackerClient {
  createIssue(feedback: FeedbackData): Promise<CreateIssueResult>
  testConnection(): Promise<TestConnectionResult>
}
