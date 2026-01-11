/**
 * Linear client for creating issues from user feedback
 */

import type {
  LinearConfig,
  FeedbackData,
  CreateIssueResult,
  TestConnectionResult,
  IssueTrackerClient,
} from './types'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

interface LinearGraphQLResponse {
  data?: {
    issueCreate?: {
      success: boolean
      issue?: {
        id: string
        identifier: string
        url: string
      }
    }
    viewer?: {
      id: string
      name: string
    }
    team?: {
      labels?: {
        nodes: Array<{ id: string; name: string }>
      }
    }
  }
  errors?: Array<{ message: string }>
}

/**
 * Creates a Linear issue tracker client
 */
export function createLinearClient(config: LinearConfig): IssueTrackerClient {
  return {
    createIssue: (feedback) => createLinearIssue(feedback, config),
    testConnection: () => testLinearConnection(config.apiKey),
  }
}

/**
 * Creates a Linear issue from user feedback
 */
export async function createLinearIssue(
  feedback: FeedbackData,
  config: LinearConfig
): Promise<CreateIssueResult> {
  try {
    const title = buildIssueTitle(feedback)
    const description = buildIssueDescription(feedback)

    // Resolve label IDs if labels are configured
    let labelIds: string[] = []
    if (config.defaultLabels && config.defaultLabels.length > 0) {
      labelIds = await resolveLabelIds(config.apiKey, config.teamId, config.defaultLabels)
    }

    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            url
          }
        }
      }
    `

    const variables = {
      input: {
        teamId: config.teamId,
        title,
        description,
        ...(labelIds.length > 0 && { labelIds }),
      },
    }

    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.apiKey,
      },
      body: JSON.stringify({ query: mutation, variables }),
    })

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.status} ${response.statusText}`)
    }

    const result: LinearGraphQLResponse = await response.json()

    if (result.errors && result.errors.length > 0) {
      const firstError = result.errors[0]
      throw new Error(`Linear GraphQL error: ${firstError?.message ?? 'Unknown error'}`)
    }

    if (!result.data?.issueCreate?.success || !result.data.issueCreate.issue) {
      throw new Error('Failed to create Linear issue: Unknown error')
    }

    const issue = result.data.issueCreate.issue

    return {
      success: true,
      issueId: issue.id,
      issueKey: issue.identifier,
      issueUrl: issue.url,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating Linear issue',
    }
  }
}

/**
 * Tests the Linear API connection
 */
export async function testLinearConnection(apiKey: string): Promise<TestConnectionResult> {
  try {
    const query = `
      query {
        viewer {
          id
          name
        }
      }
    `

    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' }
      }
      return { success: false, error: `API error: ${response.status}` }
    }

    const result: LinearGraphQLResponse = await response.json()

    if (result.errors && result.errors.length > 0) {
      const firstError = result.errors[0]
      return { success: false, error: firstError?.message ?? 'Unknown error' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Resolves label names to IDs for the given team
 */
async function resolveLabelIds(
  apiKey: string,
  teamId: string,
  labelNames: string[]
): Promise<string[]> {
  const query = `
    query GetLabels($teamId: String!) {
      team(id: $teamId) {
        labels {
          nodes {
            id
            name
          }
        }
      }
    }
  `

  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables: { teamId } }),
  })

  if (!response.ok) {
    return []
  }

  const result: LinearGraphQLResponse = await response.json()
  const labels = result.data?.team?.labels?.nodes ?? []

  const nameToId = new Map(labels.map((l) => [l.name.toLowerCase(), l.id]))

  return labelNames
    .map((name) => nameToId.get(name.toLowerCase()))
    .filter((id): id is string => id !== undefined)
}

function buildIssueTitle(feedback: FeedbackData): string {
  const firstLine = feedback.message.split('\n')[0] ?? feedback.message
  const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine

  if (feedback.elementFriendlyName) {
    return `[${feedback.elementFriendlyName}] ${title}`
  }

  return `[Feedback] ${title}`
}

function buildIssueDescription(feedback: FeedbackData): string {
  const parts: string[] = []

  parts.push('## User Feedback\n')
  parts.push(feedback.message)
  parts.push('')

  parts.push('## Context\n')
  parts.push(`**Page:** ${feedback.pageUrl}`)

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

  if (feedback.screenshotUrl) {
    parts.push('')
    parts.push('### Screenshot')
    parts.push(`![Screenshot](${feedback.screenshotUrl})`)
  }

  parts.push('')
  parts.push('---')
  const createdAt =
    typeof feedback.createdAt === 'string' ? feedback.createdAt : feedback.createdAt.toISOString()
  parts.push(`*Submitted: ${createdAt}*`)

  return parts.join('\n')
}
