# @nextdevx/feedback

Comprehensive user feedback system for Next.js applications with element picker, screenshot capture, voting, and issue tracker integration.

## Features

- **Feedback Dialog** - Beautiful modal for collecting user feedback
- **Element Picker** - Let users click on specific UI elements to reference
- **Screenshot Capture** - Automatic screenshot capture for visual context
- **Public Suggestions** - Allow users to submit and vote on feature suggestions
- **Issue Tracker Integration** - Automatically create issues in Linear, Jira, or GitHub
- **Admin Panel** - Manage feedback, review submissions, update status
- **Multi-Tenancy** - Organization-based data isolation
- **Dark Mode** - Full light/dark theme support
- **i18n Ready** - Optional next-intl integration

## Installation

```bash
npm install @nextdevx/feedback
# or
pnpm add @nextdevx/feedback
# or
yarn add @nextdevx/feedback
```

### Optional Dependencies

```bash
# For screenshot capture
npm install modern-screenshot

# For i18n support
npm install next-intl
```

## Quick Start

### 1. Add Prisma Models

Copy the schema from `node_modules/@nextdevx/feedback/prisma/schema.prisma` to your project's `prisma/schema.prisma`:

```prisma
model Feedback {
  id                  String    @id @default(cuid())
  message             String    @db.Text
  pageUrl             String
  elementXPath        String?   @db.VarChar(2000)
  elementSelector     String?   @db.VarChar(500)
  elementTagName      String?   @db.VarChar(50)
  elementFriendlyName String?   @db.VarChar(200)
  screenshotUrl       String?
  userId              String
  userEmail           String
  userName            String?
  organizationId      String?
  externalIssueId     String?
  externalIssueUrl    String?
  issueProvider       String?
  issueCreatedAt      DateTime?
  issueCreationError  String?
  isPublicSuggestion  Boolean   @default(false)
  voteScore           Int       @default(0)
  status              String    @default("pending")
  adminNotes          String?   @db.Text
  reviewedBy          String?
  reviewedAt          DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  votes               FeedbackVote[]

  @@index([userId])
  @@index([organizationId])
  @@index([status])
  @@index([isPublicSuggestion, voteScore(sort: Desc)])
}

model FeedbackVote {
  id         String   @id @default(cuid())
  feedbackId String
  userId     String
  voteType   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)

  @@unique([feedbackId, userId])
}

model IssueTrackerConfig {
  id                    String   @id @default(cuid())
  organizationId        String?  @unique
  provider              String?
  isEnabled             Boolean  @default(false)
  // Linear fields
  linearApiKeyEncrypted String?
  linearTeamId          String?
  linearDefaultLabels   String[] @default(["user-feedback"])
  // Jira fields
  jiraHost              String?
  jiraEmail             String?
  jiraApiTokenEncrypted String?
  jiraProjectKey        String?
  jiraIssueType         String?  @default("Task")
  jiraDefaultLabels     String[] @default([])
  // GitHub fields
  githubTokenEncrypted  String?
  githubRepo            String?
  githubDefaultLabels   String[] @default(["feedback"])
  encryptionIv          String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

Then run migrations:

```bash
npx prisma migrate dev --name add-feedback
```

### 2. Set Up the Provider

```tsx
// app/layout.tsx or app/providers.tsx
'use client'

import { FeedbackProvider } from '@nextdevx/feedback'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider
      config={{
        enableElementPicker: true,
        enableScreenshots: true,
        maxMessageLength: 2000,
        apiEndpoint: '/api/feedback',
        uploadEndpoint: '/api/feedback/upload',
      }}
    >
      {children}
    </FeedbackProvider>
  )
}
```

### 3. Add the Feedback Button

```tsx
// components/Header.tsx
import { FeedbackButton } from '@nextdevx/feedback'

export function Header() {
  return (
    <header>
      <nav>{/* ... */}</nav>
      <FeedbackButton />
    </header>
  )
}
```

### 4. Create API Routes

```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createFeedbackService } from '@nextdevx/feedback'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const service = createFeedbackService(prisma, auth)
  const body = await request.json()

  try {
    const feedback = await service.submitFeedback(body)
    return NextResponse.json(feedback)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit' },
      { status: 400 }
    )
  }
}
```

```typescript
// app/api/feedback/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Save to your storage solution (S3, local, etc.)
  const filename = `screenshot-${Date.now()}.jpg`
  const path = join(process.cwd(), 'public/uploads', filename)
  await writeFile(path, buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
```

## API Reference

### Components

#### FeedbackProvider

Root provider for the feedback system.

```tsx
import { FeedbackProvider } from '@nextdevx/feedback'

<FeedbackProvider
  config={{
    enableElementPicker: true,
    enableScreenshots: true,
    maxMessageLength: 2000,
    screenshotQuality: 0.8,
    apiEndpoint: '/api/feedback',
    uploadEndpoint: '/api/feedback/upload',
  }}
>
  {children}
</FeedbackProvider>
```

##### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableElementPicker` | `boolean` | `true` | Enable element selection |
| `enableScreenshots` | `boolean` | `true` | Enable screenshot capture |
| `maxMessageLength` | `number` | `2000` | Maximum feedback message length |
| `screenshotQuality` | `number` | `0.8` | Screenshot JPEG quality (0-1) |
| `apiEndpoint` | `string` | `'/api/feedback'` | Feedback submission endpoint |
| `uploadEndpoint` | `string` | `'/api/feedback/upload'` | Screenshot upload endpoint |

#### FeedbackButton

Trigger button that opens the feedback dialog.

```tsx
import { FeedbackButton } from '@nextdevx/feedback'

<FeedbackButton
  className="custom-class"
  onOpen={() => console.log('Dialog opened')}
/>
```

#### FeedbackDialog

The main feedback dialog (controlled via FeedbackProvider).

```tsx
import { FeedbackDialog } from '@nextdevx/feedback'

// Usually rendered automatically by FeedbackProvider
// Can be used standalone for custom implementations
<FeedbackDialog />
```

#### ElementPicker

Standalone element picker component.

```tsx
import { ElementPicker } from '@nextdevx/feedback'

<ElementPicker
  isOpen={isPickerOpen}
  onSelect={(elementInfo) => {
    console.log(elementInfo.friendlyName)
    console.log(elementInfo.cssSelector)
    setIsPickerOpen(false)
  }}
  onCancel={() => setIsPickerOpen(false)}
/>
```

#### FeedbackAdmin

Admin panel for managing feedback.

```tsx
import { FeedbackAdmin } from '@nextdevx/feedback'

<FeedbackAdmin
  apiEndpoint="/api/admin/feedback"
  onStatusChange={(id, status) => console.log('Status updated')}
/>
```

### Hooks

#### useFeedback

Hook for programmatic feedback submission.

```typescript
import { useFeedback } from '@nextdevx/feedback'

function MyComponent() {
  const { submitFeedback, isSubmitting, error, clearError } = useFeedback()

  const handleSubmit = async () => {
    const success = await submitFeedback({
      message: 'Great feature!',
      pageUrl: window.location.href,
      element: selectedElement, // optional
      screenshot: screenshotBlob, // optional
    })

    if (success) {
      console.log('Feedback submitted!')
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  )
}
```

#### useSuggestions

Hook for fetching public suggestions with pagination.

```typescript
import { useSuggestions } from '@nextdevx/feedback'

function SuggestionsList() {
  const {
    suggestions,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    vote,
    refetch,
  } = useSuggestions({
    sortBy: 'votes', // or 'newest'
    limit: 10,
  })

  return (
    <div>
      {suggestions.map((suggestion) => (
        <div key={suggestion.id}>
          <p>{suggestion.message}</p>
          <span>Score: {suggestion.voteScore}</span>
          <button onClick={() => vote(suggestion.id, 'up')}>Upvote</button>
          <button onClick={() => vote(suggestion.id, 'down')}>Downvote</button>
        </div>
      ))}

      <div>
        Page {page} of {totalPages}
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  )
}
```

### Services

#### createFeedbackService

Factory function to create a backend feedback service.

```typescript
import { createFeedbackService } from '@nextdevx/feedback'

const service = createFeedbackService(prisma, auth, {
  multiTenancy: {
    enabled: true,
    getOrganizationId: async () => user?.organizationId ?? null,
  },
})

// Available methods:
await service.submitFeedback(input)
await service.getMyFeedback()
await service.getSuggestions({ page: 1, limit: 10, sortBy: 'votes' })
await service.vote(feedbackId, 'up') // or 'down' or null to remove
await service.getFeedbackById(id)
```

### Issue Tracker Integration

Create issues automatically in Linear, Jira, or GitHub.

```typescript
import {
  createLinearClient,
  createJiraClient,
  createGitHubClient,
  createIssue,
  testConnection,
} from '@nextdevx/feedback'

// Linear
const linearClient = createLinearClient({
  apiKey: process.env.LINEAR_API_KEY!,
  teamId: 'team-id',
  defaultLabels: ['user-feedback'],
})

// Jira
const jiraClient = createJiraClient({
  host: 'your-company.atlassian.net',
  email: 'your-email@company.com',
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: 'PROJ',
  issueType: 'Bug',
})

// GitHub
const githubClient = createGitHubClient({
  token: process.env.GITHUB_TOKEN!,
  repo: 'owner/repo',
  defaultLabels: ['feedback', 'user-reported'],
})

// Test connection
const result = await testConnection(linearClient)
if (result.success) {
  console.log('Connected!', result.metadata)
}

// Create issue from feedback
const feedback = await service.getFeedbackById(id)
const issueResult = await createIssue(linearClient, {
  title: `Feedback: ${feedback.message.slice(0, 50)}`,
  description: feedback.message,
  pageUrl: feedback.pageUrl,
  userEmail: feedback.userEmail,
  screenshotUrl: feedback.screenshotUrl,
  elementInfo: feedback.elementFriendlyName,
})

if (issueResult.success) {
  console.log('Issue created:', issueResult.issueUrl)
}
```

### Screenshot Utilities

```typescript
import {
  captureScreenshot,
  isScreenshotAvailable,
  formatFileSize,
} from '@nextdevx/feedback'

// Check if screenshot capture is supported
if (isScreenshotAvailable()) {
  // Capture screenshot
  const blob = await captureScreenshot({
    quality: 0.8,
    type: 'image/jpeg',
    ignoreElements: (element) => {
      // Exclude certain elements from screenshot
      return element.classList.contains('no-screenshot')
    },
  })

  console.log('Screenshot size:', formatFileSize(blob.size))
}
```

### Element Picker Utilities

```typescript
import {
  getElementInfo,
  generateCssSelector,
  generateXPath,
  generateFriendlyName,
  findElementBySelector,
  shouldExcludeElement,
  getElementBounds,
  isTailwindClass,
  filterTailwindClasses,
  getNameGenerationMetrics,
  resetNameGenerationMetrics,
  clearNameCaches,
} from '@nextdevx/feedback'

// Get complete element information
const info = getElementInfo(element)
console.log(info.friendlyName)  // "Submit Button"
console.log(info.cssSelector)   // "button.btn-primary"
console.log(info.xpath)         // "//button[@class='btn-primary']"
console.log(info.tagName)       // "button"

// Individual generators
const selector = generateCssSelector(element)
const xpath = generateXPath(element)
const name = generateFriendlyName(element)

// Find element by selector
const foundElement = findElementBySelector('button.btn-primary')

// Performance metrics
const metrics = getNameGenerationMetrics()
console.log(`Cache hits: ${metrics.cacheHits}, misses: ${metrics.cacheMisses}`)
resetNameGenerationMetrics()
clearNameCaches()
```

## Types

```typescript
import type {
  Feedback,
  FeedbackInput,
  FeedbackVote,
  FeedbackStatus,
  FeedbackConfig,
  ElementInfo,
  IssueTrackerConfig,
  IssueProvider,
  IssueTrackerClient,
  CreateIssueResult,
  TestConnectionResult,
  LinearConfig,
  JiraConfig,
  GitHubConfig,
  CaptureOptions,
  FeedbackService,
  FeedbackAdminProps,
  FeedbackQueryParams,
} from '@nextdevx/feedback'
```

### Key Types

```typescript
interface FeedbackInput {
  message: string
  pageUrl: string
  element?: ElementInfo
  screenshot?: Blob
}

interface Feedback {
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
  currentUserVote?: 'up' | 'down' | null
}

type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected'
type IssueProvider = 'linear' | 'jira' | 'github'

interface ElementInfo {
  friendlyName: string
  cssSelector: string
  xpath: string
  tagName: string
}
```

## i18n Integration

### With next-intl

```tsx
import { useTranslations } from 'next-intl'
import { FeedbackProvider, feedbackMessages } from '@nextdevx/feedback'

// Merge messages
const messages = {
  feedback: feedbackMessages.en,
  // ... other messages
}

function App() {
  const t = useTranslations('feedback')
  return (
    <FeedbackProvider t={t}>
      {children}
    </FeedbackProvider>
  )
}
```

### Without next-intl

```tsx
<FeedbackProvider
  translations={{
    title: 'Send Feedback',
    placeholder: 'Describe your feedback...',
    submit: 'Submit',
    cancel: 'Cancel',
    // ... other translations
  }}
>
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `react` | >=18.0.0 | Yes |
| `react-dom` | >=18.0.0 | Yes |
| `next` | >=14.0.0 | Yes |
| `@prisma/client` | >=5.0.0 | Yes |
| `lucide-react` | >=0.300.0 | Yes |
| `modern-screenshot` | >=4.0.0 | Optional |
| `next-intl` | >=3.0.0 | Optional |

## License

MIT
