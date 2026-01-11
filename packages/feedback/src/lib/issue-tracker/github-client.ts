/**
 * GitHub Issues client for creating issues from user feedback
 * Uses GitHub REST API v3
 */

import type {
  GitHubConfig,
  FeedbackData,
  CreateIssueResult,
  TestConnectionResult,
  IssueTrackerClient,
} from './types'

interface GitHubCreateResponse {
  id: number
  number: number
  html_url: string
}

interface GitHubErrorResponse {
  message?: string
  errors?: Array<{ message: string }>
}

/**
 * Creates a GitHub issue tracker client
 */
export function createGitHubClient(config: GitHubConfig): IssueTrackerClient {
  return {
    createIssue: (feedback) => createGitHubIssue(feedback, config),
    testConnection: () => testGitHubConnection(config.token, config.repo),
  }
}

/**
 * Creates a GitHub issue from user feedback
 */
export async function createGitHubIssue(
  feedback: FeedbackData,
  config: GitHubConfig
): Promise<CreateIssueResult> {
  try {
    const [owner, repo] = config.repo.split('/')
    if (!owner || !repo) {
      throw new Error('Invalid repo format. Use owner/repo')
    }

    const title = buildIssueTitle(feedback)
    const body = buildIssueBody(feedback)

    const issueData: Record<string, unknown> = {
      title,
      body,
    }

    if (config.defaultLabels && config.defaultLabels.length > 0) {
      issueData.labels = config.defaultLabels
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'nextstack-feedback',
      },
      body: JSON.stringify(issueData),
    })

    if (!response.ok) {
      const errorBody: GitHubErrorResponse = await response.json().catch(() => ({}))
      const errorMessage =
        errorBody.message ||
        errorBody.errors?.map((e) => e.message).join(', ') ||
        `HTTP ${response.status}`
      throw new Error(`GitHub API error: ${errorMessage}`)
    }

    const result: GitHubCreateResponse = await response.json()

    return {
      success: true,
      issueId: result.id.toString(),
      issueKey: `#${result.number}`,
      issueUrl: result.html_url,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating GitHub issue',
    }
  }
}

/**
 * Tests the GitHub API connection
 */
export async function testGitHubConnection(
  token: string,
  repo: string
): Promise<TestConnectionResult> {
  try {
    const [owner, repoName] = repo.split('/')
    if (!owner || !repoName) {
      return { success: false, error: 'Invalid repo format. Use owner/repo' }
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'nextstack-feedback',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid token' }
      }
      if (response.status === 404) {
        return { success: false, error: 'Repository not found or no access' }
      }
      return { success: false, error: `API error: ${response.status}` }
    }

    // Check if we have push access (required to create issues)
    const repoData = await response.json()
    if (!repoData.permissions?.push && !repoData.permissions?.admin) {
      return { success: false, error: 'Token does not have write access to this repository' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

function buildIssueTitle(feedback: FeedbackData): string {
  const firstLine = feedback.message.split('\n')[0] ?? feedback.message
  const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine

  if (feedback.elementFriendlyName) {
    return `[${feedback.elementFriendlyName}] ${title}`
  }

  return `[Feedback] ${title}`
}

function buildIssueBody(feedback: FeedbackData): string {
  const parts: string[] = []

  // Main message
  parts.push('## User Feedback\n')
  parts.push(feedback.message)
  parts.push('')

  // Context
  parts.push('## Context\n')
  parts.push(`**Page:** ${feedback.pageUrl}`)

  // Element info if available
  if (feedback.elementFriendlyName) {
    parts.push('')
    parts.push('### Related Element')
    parts.push(`- **Name:** ${feedback.elementFriendlyName}`)
    if (feedback.elementTagName) {
      parts.push(`- **Tag:** \`<${feedback.elementTagName}>\``)
    }
    if (feedback.elementCssSelector) {
      parts.push(`- **CSS Selector:** \`${feedback.elementCssSelector}\``)
    }
    if (feedback.elementXpath) {
      parts.push(`- **XPath:** \`${feedback.elementXpath}\``)
    }
  }

  // Screenshot if available
  if (feedback.screenshotUrl) {
    parts.push('')
    parts.push('### Screenshot')
    parts.push(`![Screenshot](${feedback.screenshotUrl})`)
  }

  // Metadata
  parts.push('')
  parts.push('---')

  const metadata: string[] = []
  if (feedback.userEmail) {
    metadata.push(`Submitted by: ${feedback.userName || feedback.userEmail}`)
  }
  const createdAt =
    typeof feedback.createdAt === 'string' ? feedback.createdAt : feedback.createdAt.toISOString()
  metadata.push(`Submitted: ${createdAt}`)

  parts.push(`*${metadata.join(' | ')}*`)

  return parts.join('\n')
}
