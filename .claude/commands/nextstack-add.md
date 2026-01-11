# @nextstack Add Package

Add a specific @nextstack package to the current project.

## Usage

```
/nextstack-add <package-name>
```

## Available Packages

| Package | Description |
|---------|-------------|
| devtools | Dev mode indicator, dev-login page |
| feedback | Feedback system with element picker, screenshots, voting |
| whats-new | Changelog dialog with voting and feedback linking |
| theme | Theme provider with light/dark/system modes |
| audit | Audit logging with admin viewer |

## Steps

1. **Validate Package Name**
   - Check if the requested package exists
   - If invalid, show available packages

2. **Check Prerequisites**
   - Verify @nextstack/core is installed (required for all packages)
   - Check for App Router structure
   - Verify auth provider is configured

3. **Add Dependency**
   Add to package.json:
   ```json
   {
     "dependencies": {
       "@nextstack/<package>": "github:nextstack-dev/next-components#main"
     }
   }
   ```

4. **Generate Files** (package-specific)

   **devtools:**
   - `app/api/dev/info/route.ts` - Dev info API endpoint
   - `app/dev-login/page.tsx` - Test user login page

   **feedback:**
   - `app/api/feedback/route.ts` - Submit/list feedback
   - `app/api/feedback/[id]/vote/route.ts` - Vote on feedback
   - `app/api/suggestions/route.ts` - Public suggestions endpoint

   **whats-new:**
   - `app/api/whats-new/route.ts` - List changelog entries
   - `app/api/whats-new/[id]/vote/route.ts` - Vote on entries

   **audit:**
   - `app/api/admin/audit/route.ts` - Query audit logs

   **theme:**
   - No API routes needed (client-side only)

5. **Show Prisma Schema** (if applicable)
   Display the models to add for feedback, whats-new, or audit packages.

6. **Provide Usage Examples**

   **devtools:**
   ```tsx
   import { DevModeIndicator } from '@nextstack/devtools'

   // In your layout or app
   <DevModeIndicator showGitBranch showDatabase />
   ```

   **feedback:**
   ```tsx
   import { FeedbackButton, FeedbackProvider } from '@nextstack/feedback'

   <FeedbackProvider apiUrl="/api/feedback">
     <FeedbackButton />
   </FeedbackProvider>
   ```

   **whats-new:**
   ```tsx
   import { WhatsNewDialog, WhatsNewBadge } from '@nextstack/whats-new'

   <WhatsNewBadge apiUrl="/api/whats-new" />
   <WhatsNewDialog entries={entries} />
   ```

   **theme:**
   ```tsx
   import { ThemeProvider, ThemeToggle } from '@nextstack/theme'

   <ThemeProvider>
     <ThemeToggle />
   </ThemeProvider>
   ```

   **audit:**
   ```tsx
   import { AuditLogViewer } from '@nextstack/audit'

   <AuditLogViewer
     fetchLogs={async (params) => {
       const res = await fetch(`/api/admin/audit?${new URLSearchParams(params)}`)
       return res.json()
     }}
   />
   ```

7. **Run Installation**
   Execute `pnpm install`

## Example

```
/nextstack-add feedback

Adding @nextstack/feedback

Generated files:
  app/api/feedback/route.ts
  app/api/feedback/[id]/vote/route.ts
  app/api/suggestions/route.ts

Prisma schema additions needed:
  - Feedback model
  - FeedbackVote model
  - IssueTrackerConfig model

Usage:
  import { FeedbackButton } from '@nextstack/feedback'

  <FeedbackButton />

Next steps:
1. Run pnpm install
2. Add Prisma models to schema.prisma
3. Run npx prisma generate && npx prisma db push
```
