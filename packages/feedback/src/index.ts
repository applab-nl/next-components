// @nextdevx/feedback - User feedback system

// Components
export { FeedbackButton } from './components/FeedbackButton'
export { FeedbackDialog } from './components/FeedbackDialog'
export { FeedbackProvider } from './components/FeedbackProvider'
export { ElementPicker } from './components/ElementPicker'

// Admin components
export { FeedbackAdmin } from './components/admin'
export type { FeedbackAdminProps, FeedbackQueryParams } from './components/admin'

// Hooks
export { useFeedback } from './hooks/useFeedback'
export { useSuggestions } from './hooks/useSuggestions'

// Services
export { createFeedbackService } from './services/feedback-service'
export type { FeedbackService } from './services/feedback-service'

// Element picker utilities
export {
  isTailwindClass,
  filterTailwindClasses,
  generateXPath,
  generateCssSelector,
  generateFriendlyName,
  getElementInfo,
  getElementLabel,
  findElementBySelector,
  shouldExcludeElement,
  getElementBounds,
  // Performance metrics
  getNameGenerationMetrics,
  resetNameGenerationMetrics,
  clearNameCaches,
} from './lib/element-picker-utils'

// Screenshot capture utilities
export {
  captureScreenshot,
  formatFileSize,
  isScreenshotAvailable,
} from './lib/screenshot-capture'
export type { CaptureOptions } from './lib/screenshot-capture'

// Issue tracker integrations
export {
  createIssueTrackerClient,
  createIssue,
  testConnection,
  createLinearClient,
  createJiraClient,
  createGitHubClient,
} from './lib/issue-tracker'
export type {
  IssueTrackerProvider,
  IssueTrackerConfig as ProviderConfig,
  IssueTrackerClient,
  CreateIssueResult,
  TestConnectionResult,
  FeedbackData as IssueTrackerFeedbackData,
  LinearConfig,
  JiraConfig,
  GitHubConfig,
} from './lib/issue-tracker'

// Types
export type {
  Feedback,
  FeedbackInput,
  FeedbackVote,
  ElementInfo,
  FeedbackConfig,
  IssueTrackerConfig,
} from './types'

// i18n
export { feedbackMessages } from './i18n/messages'
