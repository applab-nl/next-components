export const nextstackProviderSetup = (authProvider: string) => `import { NextstackProvider } from '@nextstack/core'
${getAuthImport(authProvider)}
import { prisma } from '@/lib/prisma'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextstackProvider
      config={{
        auth: ${getAuthAdapter(authProvider)},
        prisma,
        multiTenancy: {
          enabled: false,
          getOrganizationId: async () => null,
        },
      }}
    >
      {children}
    </NextstackProvider>
  )
}
`

function getAuthImport(provider: string): string {
  switch (provider) {
    case 'supabase':
      return `import { createSupabaseAuthAdapter } from '@nextstack/core'
import { createClient } from '@/lib/supabase/server'`
    case 'clerk':
      return `import { createClerkAuthAdapter } from '@nextstack/core'`
    case 'next-auth':
      return `import { createNextAuthAdapter } from '@nextstack/core'
import { authOptions } from '@/lib/auth'`
    default:
      return ''
  }
}

function getAuthAdapter(provider: string): string {
  switch (provider) {
    case 'supabase':
      return 'createSupabaseAuthAdapter(createClient())'
    case 'clerk':
      return 'createClerkAuthAdapter()'
    case 'next-auth':
      return 'createNextAuthAdapter(authOptions)'
    default:
      return '/* TODO: Configure auth adapter */'
  }
}

export const prismaSchemaAdditions: Record<string, string> = {
  feedback: `
// ====== @nextstack/feedback ======
// Copy these models to your schema.prisma

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
  @@index([createdAt(sort: Desc)])
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
  @@index([feedbackId])
  @@index([userId])
}

model IssueTrackerConfig {
  id                    String   @id @default(cuid())
  organizationId        String?  @unique
  provider              String?
  isEnabled             Boolean  @default(false)
  linearApiKeyEncrypted String?
  linearTeamId          String?
  linearDefaultLabels   String[] @default(["user-feedback"])
  jiraHost              String?
  jiraEmail             String?
  jiraApiTokenEncrypted String?
  jiraProjectKey        String?
  jiraIssueType         String?  @default("Task")
  jiraDefaultLabels     String[] @default([])
  githubTokenEncrypted  String?
  githubRepo            String?
  githubDefaultLabels   String[] @default(["feedback"])
  encryptionIv          String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
`,

  'whats-new': `
// ====== @nextstack/whats-new ======
// Copy these models to your schema.prisma

model WhatsNewEntry {
  id          String    @id @default(cuid())
  date        DateTime
  title       String    @db.VarChar(100)
  summary     String    @db.Text
  content     String?   @db.Text
  isPublished Boolean   @default(true)
  upvotes     Int       @default(0)
  downvotes   Int       @default(0)
  createdBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  votes          WhatsNewVote[]
  linkedFeedback WhatsNewFeedbackLink[]

  @@index([date(sort: Desc)])
  @@index([isPublished])
}

model WhatsNewVote {
  id        String   @id @default(cuid())
  entryId   String
  userId    String
  voteType  String
  createdAt DateTime @default(now())
  entry     WhatsNewEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, userId])
  @@index([entryId])
  @@index([userId])
}

model WhatsNewFeedbackLink {
  id         String   @id @default(cuid())
  entryId    String
  feedbackId String
  createdBy  String?
  createdAt  DateTime @default(now())
  entry      WhatsNewEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, feedbackId])
  @@index([entryId])
  @@index([feedbackId])
}

model WhatsNewUserVisit {
  id            String   @id @default(cuid())
  userId        String   @unique
  lastVisitedAt DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}
`,

  audit: `
// ====== @nextstack/audit ======
// Copy this model to your schema.prisma

model AuditLog {
  id             String   @id @default(cuid())
  userId         String?
  userEmail      String
  userName       String?
  timestamp      DateTime @default(now())
  organizationId String?
  ipAddress      String?
  userAgent      String?
  entityType     String
  entityId       String?
  entityName     String?
  action         String
  changes        Json?
  metadata       Json?

  @@index([organizationId])
  @@index([userId])
  @@index([timestamp(sort: Desc)])
  @@index([entityType])
  @@index([action])
  @@index([organizationId, timestamp(sort: Desc)])
}
`,
}
