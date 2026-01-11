/**
 * Issue tracker integrations for Linear, Jira, and GitHub Issues
 */

// Types
export type {
  IssueTrackerProvider,
  CreateIssueResult,
  TestConnectionResult,
  FeedbackData,
  LinearConfig,
  JiraConfig,
  GitHubConfig,
  IssueTrackerClient,
} from './types'

// Service
export {
  createIssueTrackerClient,
  createIssue,
  testConnection,
} from './service'
export type { IssueTrackerConfig } from './service'

// Individual clients (for direct use)
export { createLinearClient, createLinearIssue, testLinearConnection } from './linear-client'
export { createJiraClient, createJiraIssue, testJiraConnection } from './jira-client'
export { createGitHubClient, createGitHubIssue, testGitHubConnection } from './github-client'
