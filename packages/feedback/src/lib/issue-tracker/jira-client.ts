/**
 * Jira client for creating issues from user feedback
 * Uses Jira REST API v3
 */

import type {
  JiraConfig,
  FeedbackData,
  CreateIssueResult,
  TestConnectionResult,
  IssueTrackerClient,
} from './types'

interface JiraCreateResponse {
  id: string
  key: string
  self: string
}

interface JiraErrorResponse {
  errorMessages?: string[]
  errors?: Record<string, string>
}

/**
 * Creates a Jira issue tracker client
 */
export function createJiraClient(config: JiraConfig): IssueTrackerClient {
  return {
    createIssue: (feedback) => createJiraIssue(feedback, config),
    testConnection: () => testJiraConnection(config.host, config.email, config.apiToken),
  }
}

/**
 * Creates a Jira issue from user feedback
 */
export async function createJiraIssue(
  feedback: FeedbackData,
  config: JiraConfig
): Promise<CreateIssueResult> {
  try {
    const baseUrl = `https://${config.host}/rest/api/3`
    const auth = btoa(`${config.email}:${config.apiToken}`)

    const title = buildIssueTitle(feedback)
    const description = buildAdfDescription(feedback)

    const issueData: Record<string, unknown> = {
      fields: {
        project: { key: config.projectKey },
        summary: title,
        description,
        issuetype: { name: config.issueType || 'Task' },
      },
    }

    if (config.defaultLabels && config.defaultLabels.length > 0) {
      issueData.fields = {
        ...(issueData.fields as Record<string, unknown>),
        labels: config.defaultLabels,
      }
    }

    const response = await fetch(`${baseUrl}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(issueData),
    })

    if (!response.ok) {
      const errorBody: JiraErrorResponse = await response.json().catch(() => ({}))
      const errorMessage =
        errorBody.errorMessages?.join(', ') ||
        Object.values(errorBody.errors || {}).join(', ') ||
        `HTTP ${response.status}`
      throw new Error(`Jira API error: ${errorMessage}`)
    }

    const result: JiraCreateResponse = await response.json()

    return {
      success: true,
      issueId: result.id,
      issueKey: result.key,
      issueUrl: `https://${config.host}/browse/${result.key}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating Jira issue',
    }
  }
}

/**
 * Tests the Jira API connection
 */
export async function testJiraConnection(
  host: string,
  email: string,
  apiToken: string
): Promise<TestConnectionResult> {
  try {
    const baseUrl = `https://${host}/rest/api/3`
    const auth = btoa(`${email}:${apiToken}`)

    const response = await fetch(`${baseUrl}/myself`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid credentials' }
      }
      if (response.status === 404) {
        return { success: false, error: 'Invalid Jira host' }
      }
      return { success: false, error: `API error: ${response.status}` }
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

/**
 * Builds an Atlassian Document Format (ADF) description
 * Jira API v3 requires ADF format for rich text
 */
function buildAdfDescription(feedback: FeedbackData): object {
  const content: object[] = []

  // Header
  content.push({
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text: 'User Feedback' }],
  })

  // Main message
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: feedback.message }],
  })

  // Context header
  content.push({
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text: 'Context' }],
  })

  // Page URL
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Page: ', marks: [{ type: 'strong' }] },
      {
        type: 'text',
        text: feedback.pageUrl,
        marks: [{ type: 'link', attrs: { href: feedback.pageUrl } }],
      },
    ],
  })

  // Element info if available
  if (feedback.elementFriendlyName) {
    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Related Element' }],
    })

    const elementItems: object[] = [
      {
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Name: ', marks: [{ type: 'strong' }] },
              { type: 'text', text: feedback.elementFriendlyName },
            ],
          },
        ],
      },
    ]

    if (feedback.elementTagName) {
      elementItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Tag: ', marks: [{ type: 'strong' }] },
              { type: 'text', text: `<${feedback.elementTagName}>`, marks: [{ type: 'code' }] },
            ],
          },
        ],
      })
    }

    if (feedback.elementCssSelector) {
      elementItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'CSS Selector: ', marks: [{ type: 'strong' }] },
              { type: 'text', text: feedback.elementCssSelector, marks: [{ type: 'code' }] },
            ],
          },
        ],
      })
    }

    if (feedback.elementXpath) {
      elementItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'XPath: ', marks: [{ type: 'strong' }] },
              { type: 'text', text: feedback.elementXpath, marks: [{ type: 'code' }] },
            ],
          },
        ],
      })
    }

    content.push({
      type: 'bulletList',
      content: elementItems,
    })
  }

  // Screenshot if available
  if (feedback.screenshotUrl) {
    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Screenshot' }],
    })
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'View Screenshot',
          marks: [{ type: 'link', attrs: { href: feedback.screenshotUrl } }],
        },
      ],
    })
  }

  // Divider
  content.push({ type: 'rule' })

  // Timestamp
  const createdAt =
    typeof feedback.createdAt === 'string' ? feedback.createdAt : feedback.createdAt.toISOString()
  content.push({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: `Submitted: ${createdAt}`,
        marks: [{ type: 'em' }],
      },
    ],
  })

  return {
    type: 'doc',
    version: 1,
    content,
  }
}
