<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# @nextdevx Development Guide

Instructions for Claude Code when working on this monorepo.

## Project Structure

```
packages/
├── core/       # Auth adapters, NextstackProvider, ElementPicker
├── devtools/   # DevTools, DevLoginPage
├── feedback/   # FeedbackButton, screenshots
├── whats-new/  # WhatsNewDialog, WhatsNewBadge
├── theme/      # ThemeProvider, ThemeToggle
├── audit/      # AuditLogViewer, createAuditLog
└── cli/        # npx commands for setup
```

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests (149 tests)
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
pnpm --filter @nextdevx/feedback build  # Build specific package
```

## Code Patterns

### Services (Framework-Agnostic)
```typescript
export function createFeedbackService(prisma: PrismaClient, auth: AuthAdapter) {
  return {
    async submit(input) {
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('Unauthorized')
      return prisma.feedback.create({ data: { ...input, userId: user.id } })
    }
  }
}
```

### Components
```typescript
interface Props {
  position?: 'bottom-right' | 'bottom-left'
  className?: string
}

export function MyComponent({ position = 'bottom-right', className }: Props) {
  // Implementation
}
MyComponent.displayName = 'MyComponent'
```

## Architecture Rules

1. **Auth**: Always use auth adapter from context, never import auth directly
2. **Database**: Use Prisma only, no raw SQL except migrations
3. **Styling**: Tailwind CSS with `dark:` classes, use CSS variables for theming
4. **i18n**: All user-facing strings via next-intl
5. **Tests**: Co-locate with source files, use descriptive names

## File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Types: `types.ts`
- Tests: `*.test.ts` or `*.test.tsx`

## Git Workflow

- Feature branches: `feature/{package-name}/{feature}`
- Bug fixes: `fix/{package-name}/{description}`
- No Claude attribution in commits
- Describe the "why" not the "what" in commit messages

## Testing

Run tests with `pnpm test`. All packages use Vitest with React Testing Library.
Current: 149 passing tests, 1 skipped (XPath in happy-dom).

## Adding New Packages

1. Create `packages/{name}/`
2. Add `package.json` with `@nextdevx/{name}`
3. Create `src/index.ts` entry point
4. Add `tsconfig.json` extending `../../tsconfig.base.json`
5. If DB needed, add `prisma/schema.prisma`
