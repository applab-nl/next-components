# @nextstack/devtools

Developer experience tools for Next.js applications. Provides a floating indicator showing development environment info and tools for AI-assisted development.

## Installation

```bash
pnpm add @nextstack/devtools
```

## Components

### DevTools

A floating development panel that displays environment info and provides developer utilities.

```tsx
import { DevTools } from '@nextstack/devtools'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <DevTools />
      </body>
    </html>
  )
}
```

#### Features

- **Environment Info**: Shows current git branch, database, user, and environment
- **Prompt Copier**: Select any element and copy its info for AI prompts (Ctrl/Cmd+Shift+C)
- **Localhost Only**: Only visible in development by default

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Position on screen |
| `showGitBranch` | `boolean` | `true` | Show git branch info |
| `showDatabase` | `boolean` | `true` | Show database info |
| `showUser` | `boolean` | `true` | Show current user |
| `devInfoEndpoint` | `string` | `'/api/dev/info'` | API endpoint for dev info |
| `databaseId` | `string` | - | Database identifier to display |
| `databasePort` | `number \| string` | - | Database port to display |
| `userEmail` | `string \| null` | - | User email (overrides auth context) |
| `userId` | `string \| null` | - | User ID (overrides auth context) |
| `localhostOnly` | `boolean` | `true` | Only show on localhost |
| `enablePromptCopier` | `boolean` | `true` | Enable element picker for AI prompts |
| `promptCopierShortcut` | `string \| null \| false` | `'ctrl+shift+c'` | Keyboard shortcut |
| `translations` | `DevToolsTranslations` | - | Custom translations |
| `t` | `function` | - | Translation function from next-intl |
| `className` | `string` | - | Additional CSS classes |

#### Prompt Copier

The prompt copier feature lets you select any element on the page and copy its info to the clipboard in a format optimized for AI prompts:

```
Page: http://localhost:3000/dashboard
Element: "Submit Button"
Selector: button.btn-primary
XPath: //button[@class="btn-primary"]
Tag: button
```

**Usage:**
1. Click the "Copy Element" button in the expanded DevTools panel, or
2. Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
3. Hover over any element to highlight it
4. Click to select and copy to clipboard

### DevLoginPage

A development-only login page for quickly switching between test accounts.

```tsx
import { DevLoginPage, defineTestUsers } from '@nextstack/devtools'

const testUsers = defineTestUsers([
  { email: 'admin@example.com', password: 'test123', name: 'Admin User', role: 'admin' },
  { email: 'user@example.com', password: 'test123', name: 'Regular User', role: 'user' },
])

export default function DevLogin() {
  return <DevLoginPage testUsers={testUsers} />
}
```

## API Endpoint

Create an API route to provide dev info:

```ts
// app/api/dev/info/route.ts
import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  const branch = execSync('git branch --show-current').toString().trim()

  return NextResponse.json({
    branch,
    database: process.env.DATABASE_URL?.includes('localhost') ? 'Local' : 'Remote',
    databasePort: 5432,
  })
}
```

## Internationalization

### With next-intl

```tsx
import { useTranslations } from 'next-intl'
import { DevTools } from '@nextstack/devtools'

function DevToolsWrapper() {
  const t = useTranslations('devMode')
  return <DevTools t={t} />
}
```

### With Custom Translations

```tsx
<DevTools
  translations={{
    badge: 'DEV',
    auth: 'Auth',
    notAuthenticated: 'Not authenticated',
    database: 'Database',
    environment: 'Environment',
    branch: 'Branch',
    userId: 'ID: {id}',
    copyElement: 'Copy Element',
    copyElementTooltip: 'Select an element to copy for AI prompts',
    copied: 'Copied!',
    selectElement: 'Select element for prompt',
  }}
/>
```

### Default Messages

Import default messages to merge with your i18n setup:

```ts
import { devtoolsMessages } from '@nextstack/devtools'

// English and Dutch translations included
const messages = {
  ...devtoolsMessages.en,
  // your other messages
}
```

## Migration from DevModeIndicator

`DevModeIndicator` has been renamed to `DevTools` and now includes additional features. The old component is deprecated but still works:

```tsx
// Before (deprecated)
import { DevModeIndicator } from '@nextstack/devtools'
<DevModeIndicator />

// After (recommended)
import { DevTools } from '@nextstack/devtools'
<DevTools />
```

The `DevModeIndicator` component now shows a console warning in development mode and will be removed in a future version.

### New Props in DevTools

- `enablePromptCopier` - Enable/disable the element picker feature (default: `true`)
- `promptCopierShortcut` - Customize or disable the keyboard shortcut

## License

MIT
