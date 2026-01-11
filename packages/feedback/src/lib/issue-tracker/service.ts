/**
 * Issue Tracker Service
 * Orchestrates issue creation across Linear, Jira, and GitHub
 */

import { createLinearClient, createLinearIssue, testLinearConnection } from './linear-client'
import { createJiraClient, createJiraIssue, testJiraConnection } from './jira-client'
import { createGitHubClient, createGitHubIssue, testGitHubConnection } from './github-client'
import type {
  IssueTrackerProvider,
  IssueTrackerClient,
  LinearConfig,
  JiraConfig,
  GitHubConfig,
  FeedbackData,
  CreateIssueResult,
  TestConnectionResult,
} from './types'

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000

export type IssueTrackerConfig =
  | { provider: 'linear'; config: LinearConfig }
  | { provider: 'jira'; config: JiraConfig }
  | { provider: 'github'; config: GitHubConfig }

/**
 * Creates an issue tracker client for the specified provider
 */
export function createIssueTrackerClient(config: IssueTrackerConfig): IssueTrackerClient {
  switch (config.provider) {
    case 'linear':
      return createLinearClient(config.config)
    case 'jira':
      return createJiraClient(config.config)
    case 'github':
      return createGitHubClient(config.config)
    default:
      throw new Error(`Unknown provider: ${(config as { provider: string }).provider}`)
  }
}

/**
 * Creates an issue using the specified provider with retry logic
 */
export async function createIssue(
  feedback: FeedbackData,
  config: IssueTrackerConfig
): Promise<CreateIssueResult> {
  return executeWithRetry(async () => {
    switch (config.provider) {
      case 'linear':
        return createLinearIssue(feedback, config.config)
      case 'jira':
        return createJiraIssue(feedback, config.config)
      case 'github':
        return createGitHubIssue(feedback, config.config)
      default:
        return {
          success: false,
          error: `Unknown provider: ${(config as { provider: string }).provider}`,
        }
    }
  })
}

/**
 * Tests the connection to the specified issue tracker
 */
export async function testConnection(
  provider: IssueTrackerProvider,
  credentials: {
    // Linear
    linearApiKey?: string
    // Jira
    jiraHost?: string
    jiraEmail?: string
    jiraApiToken?: string
    // GitHub
    githubToken?: string
    githubRepo?: string
  }
): Promise<TestConnectionResult> {
  switch (provider) {
    case 'linear':
      if (!credentials.linearApiKey) {
        return { success: false, error: 'Linear API key is required' }
      }
      return testLinearConnection(credentials.linearApiKey)

    case 'jira':
      if (!credentials.jiraHost || !credentials.jiraEmail || !credentials.jiraApiToken) {
        return { success: false, error: 'Jira host, email, and API token are required' }
      }
      return testJiraConnection(credentials.jiraHost, credentials.jiraEmail, credentials.jiraApiToken)

    case 'github':
      if (!credentials.githubToken || !credentials.githubRepo) {
        return { success: false, error: 'GitHub token and repository are required' }
      }
      return testGitHubConnection(credentials.githubToken, credentials.githubRepo)

    default:
      return { success: false, error: 'Unknown provider' }
  }
}

/**
 * Executes a function with exponential backoff retry
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY
): Promise<T> {
  let lastError: Error | undefined
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        break
      }

      if (!isRetryableError(lastError)) {
        break
      }

      await sleep(delay)
      delay *= 2
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Determines if an error is worth retrying
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Retry on network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return true
  }

  // Retry on rate limits (429)
  if (message.includes('429') || message.includes('rate limit')) {
    return true
  }

  // Retry on server errors (500+)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504')
  ) {
    return true
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
