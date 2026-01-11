# @nextstack Database Migrations

Run database migrations for @nextstack packages.

## Usage

```
/nextstack-migrate [package-name]
```

If no package name is provided, migrate all installed @nextstack packages.

## Steps

1. **Detect Installed Packages**
   Check package.json for installed @nextstack packages that require database models:
   - @nextstack/feedback
   - @nextstack/whats-new
   - @nextstack/audit

2. **Check Prisma Schema**
   Verify that `prisma/schema.prisma` exists and contains the required models for each package.

3. **Show Missing Models**
   If any required models are missing, display them:

   **feedback:**
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
   ```

   **whats-new:**
   ```prisma
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
   ```

   **audit:**
   ```prisma
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
   ```

4. **Generate Migration**
   Run:
   ```bash
   npx prisma migrate dev --name add_nextstack_models
   ```

   Or for production:
   ```bash
   npx prisma migrate deploy
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

## Example

```
/nextstack-migrate

Checking installed @nextstack packages...

Found:
  - @nextstack/feedback
  - @nextstack/audit

Checking prisma/schema.prisma...

Missing models:
  - Feedback (feedback)
  - FeedbackVote (feedback)
  - IssueTrackerConfig (feedback)
  - AuditLog (audit)

Would you like me to:
1. Show the Prisma models to copy
2. Add them to your schema.prisma automatically
3. Run the migration after adding

Choose option: 2

Added models to prisma/schema.prisma

Running migration...
  npx prisma migrate dev --name add_nextstack_models

Migration complete!
```
