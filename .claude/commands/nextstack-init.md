# @nextstack Initialization

Initialize @nextstack packages in the current project.

## Steps

1. **Detect Project Setup**
   - Verify this is a Next.js App Router project (check for `app/` or `src/app/` directory)
   - Check Next.js version in package.json (requires 16+)
   - Detect auth provider if already configured (look for Supabase, Clerk, or NextAuth imports)
   - Check for existing Prisma setup (`prisma/schema.prisma`)

2. **Ask User for Configuration** (if not auto-detected)
   - Which @nextstack packages to install: devtools, feedback, whats-new, theme, audit
   - Which auth provider: Supabase, Clerk, or NextAuth

3. **Add Dependencies to package.json**
   ```json
   {
     "dependencies": {
       "@nextstack/core": "github:nextstack-dev/next-components#main",
       "@nextstack/devtools": "github:nextstack-dev/next-components#main"
     }
   }
   ```

4. **Generate Provider File**
   Create `lib/nextstack-provider.tsx` (or `src/lib/nextstack-provider.tsx`) with:
   - NextstackProvider wrapper
   - Auth adapter configuration for the selected provider
   - Prisma client import

5. **Generate API Routes** (for packages that need them)
   - feedback: `app/api/feedback/route.ts`, `app/api/feedback/[id]/vote/route.ts`, `app/api/suggestions/route.ts`
   - whats-new: `app/api/whats-new/route.ts`, `app/api/whats-new/[id]/vote/route.ts`
   - audit: `app/api/admin/audit/route.ts`
   - devtools: `app/api/dev/info/route.ts`, `app/dev-login/page.tsx`

6. **Show Prisma Schema Additions**
   Display the models that need to be added to `prisma/schema.prisma` for each selected package.

7. **Update Layout**
   Suggest adding the Providers wrapper to `app/layout.tsx`:
   ```tsx
   import { Providers } from '@/lib/nextstack-provider'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <Providers>{children}</Providers>
         </body>
       </html>
     )
   }
   ```

8. **Run Installation**
   Execute `pnpm install` (or npm/yarn based on lockfile detection)

## Example Output

```
@nextstack initialization

Detected: Next.js 16.0.0, App Router, Supabase auth

Installing packages:
- @nextstack/core
- @nextstack/devtools
- @nextstack/feedback

Generated files:
  lib/nextstack-provider.tsx
  app/api/feedback/route.ts
  app/api/feedback/[id]/vote/route.ts
  app/api/suggestions/route.ts
  app/api/dev/info/route.ts
  app/dev-login/page.tsx

Prisma schema additions:
  Add the Feedback, FeedbackVote, and IssueTrackerConfig models

Next steps:
1. Add Prisma models to schema.prisma
2. Run: npx prisma generate && npx prisma db push
3. Wrap your app with Providers in layout.tsx
```
