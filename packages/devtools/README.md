# @nextdevx/devtools

Developer experience tools for Next.js applications. Provides a floating development mode indicator with environment info, element picker for AI prompts, and a dev-only login page for quick test account access.

## Features

- **DevTools** - Floating indicator showing git branch, database, user, and environment
- **Element Picker** - Select DOM elements and copy their info for AI prompts
- **DevLoginPage** - Development-only login page for quick test account access
- **Localhost-only** - Components automatically hide in production for security
- **Dark Mode Support** - Full support for light and dark themes
- **i18n Ready** - Optional next-intl integration for translations

## Installation

```bash
npm install @nextdevx/devtools
# or
pnpm add @nextdevx/devtools
# or
yarn add @nextdevx/devtools
```

## Quick Start

### DevTools Component

Add the floating dev indicator to your layout:

```tsx
// app/layout.tsx
import { DevTools } from '@nextdevx/devtools'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <DevTools />
      </body>
    </html>
  )
}
```

### Dev Login Page

Create a development-only login page:

```tsx
// app/dev-login/page.tsx
import { DevLoginPage, defineTestUsers } from '@nextdevx/devtools'

const testUsers = defineTestUsers([
  {
    id: 'admin',
    email: 'admin@test.local',
    password: 'test123',
    name: 'Admin User',
    role: 'admin',
    icon: 'shield',
    color: 'purple',
    category: 'Administrators',
    description: 'Full access to all features',
  },
  {
    id: 'user',
    email: 'user@test.local',
    password: 'test123',
    name: 'Regular User',
    role: 'user',
    icon: 'user',
    color: 'blue',
    category: 'Users',
    description: 'Standard user access',
  },
  {
    id: 'viewer',
    email: 'viewer@test.local',
    password: 'test123',
    name: 'Viewer',
    role: 'viewer',
    icon: 'eye',
    color: 'gray',
    category: 'Users',
    description: 'Read-only access',
  },
])

export default function DevLogin() {
  return <DevLoginPage users={testUsers} redirectTo="/dashboard" />
}
```

## API Reference

### DevTools

Floating development mode indicator with expandable info panel and element picker.

```tsx
import { DevTools } from '@nextdevx/devtools'

<DevTools
  position="bottom-right"
  showGitBranch={true}
  showDatabase={true}
  showUser={true}
  enablePromptCopier={true}
  promptCopierShortcut="ctrl+shift+c"
/>
```

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
| `userEmail` | `string \| null` | - | Override user email (bypasses auth context) |
| `userId` | `string \| null` | - | Override user ID (bypasses auth context) |
| `className` | `string` | `''` | Additional CSS classes |
| `localhostOnly` | `boolean` | `true` | Only show on localhost |
| `translations` | `DevToolsTranslations` | - | Custom translations |
| `t` | `(key: string, values?: Record<string, string>) => string` | - | Translation function (next-intl) |
| `enablePromptCopier` | `boolean` | `true` | Enable element picker feature |
| `promptCopierShortcut` | `string \| null \| false` | `'ctrl+shift+c'` | Keyboard shortcut for element picker |

#### Translations

```typescript
interface DevToolsTranslations {
  badge?: string              // Default: 'DEV'
  auth?: string               // Default: 'Auth'
  notAuthenticated?: string   // Default: 'Not authenticated'
  database?: string           // Default: 'Database'
  environment?: string        // Default: 'Environment'
  branch?: string             // Default: 'Branch'
  userId?: string             // Default: 'ID: {id}'
  copyElement?: string        // Default: 'Copy Element'
  copyElementTooltip?: string // Default: 'Select an element to copy for AI prompts'
  copied?: string             // Default: 'Copied!'
  selectElement?: string      // Default: 'Select element for prompt'
  copyDialogTitle?: string    // Default: 'Copy Element Info'
  quickCopy?: string          // Default: 'Quick Copy'
  cssOnly?: string            // Default: 'CSS Selector'
  xpathOnly?: string          // Default: 'XPath'
  fullPrompt?: string         // Default: 'Full Prompt'
  advancedOptions?: string    // Default: 'Advanced Options'
  fieldPageUrl?: string       // Default: 'Page URL'
  fieldElementName?: string   // Default: 'Element Name'
  fieldCssSelector?: string   // Default: 'CSS Selector'
  fieldXpath?: string         // Default: 'XPath'
  fieldTagName?: string       // Default: 'Tag Name'
  preview?: string            // Default: 'Preview'
  copyToClipboard?: string    // Default: 'Copy to Clipboard'
  cancel?: string             // Default: 'Cancel'
}
```

### DevLoginPage

Development-only login page for quick test account access. **Only accessible on localhost** for security.

```tsx
import { DevLoginPage, defineTestUsers } from '@nextdevx/devtools'

const users = defineTestUsers([/* ... */])

<DevLoginPage
  users={users}
  redirectTo="/dashboard"
  showCustomLogin={true}
  title="Development Login"
  subtitle="Quick access to test accounts"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `users` | `TestUser[]` | **required** | Test users to display |
| `redirectTo` | `string` | `'/dashboard'` | URL to redirect after login |
| `showCustomLogin` | `boolean` | `true` | Show custom email/password form |
| `title` | `string` | `'Development Login'` | Page title |
| `subtitle` | `string` | `'Quick access to test accounts'` | Page subtitle |
| `className` | `string` | `''` | Additional CSS classes |

### defineTestUsers

Helper function to create typed test user configurations with defaults.

```typescript
import { defineTestUsers, type TestUser } from '@nextdevx/devtools'

const testUsers = defineTestUsers([
  {
    id: 'admin',
    email: 'admin@test.local',
    password: 'test123',
    name: 'Admin User',
    role: 'admin',
    icon: 'shield',
    color: 'purple',
    category: 'Administrators',
    description: 'Full access to all features',
    metadata: {
      'Organization': 'Acme Corp',
      'Plan': 'Enterprise',
    },
  },
])
```

#### TestUser Interface

```typescript
interface TestUser {
  /** Unique identifier for the test user */
  id: string
  /** Email address (used for login) */
  email: string
  /** Password (used for login) */
  password: string
  /** Display name */
  name: string
  /** User role (e.g., 'admin', 'user', 'viewer') */
  role?: string
  /** Lucide icon name */
  icon?: IconName
  /** Badge color */
  color?: BadgeColor
  /** Category for grouping in UI */
  category?: string
  /** Short description of the user */
  description?: string
  /** Additional metadata displayed in UI */
  metadata?: Record<string, string>
}

type IconName =
  | 'shield' | 'user' | 'users' | 'eye' | 'edit'
  | 'crown' | 'star' | 'activity' | 'settings'
  | 'database' | 'code' | 'globe'

type BadgeColor =
  | 'purple' | 'blue' | 'green' | 'orange'
  | 'red' | 'gray' | 'yellow' | 'pink'
```

## API Route Setup

The DevTools component fetches git branch and other info from an API endpoint. Create the endpoint:

```typescript
// app/api/dev/info/route.ts
import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  // Only in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({}, { status: 403 })
  }

  let branch = 'unknown'
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim()
  } catch {
    // Git not available
  }

  return NextResponse.json({
    branch,
    database: process.env.DATABASE_NAME ?? 'Local',
    databasePort: process.env.DATABASE_PORT ?? 5432,
  })
}
```

Or use the pre-built handler:

```typescript
// app/api/dev/info/route.ts
export { GET } from '@nextdevx/devtools/api'
```

## Element Picker

The DevTools includes an element picker feature for AI-assisted development:

1. Press `Ctrl+Shift+C` (configurable) or click "Copy Element" in the expanded DevTools
2. Hover over any element on the page - it will be highlighted
3. Click to select the element
4. A dialog opens with options to copy:
   - **CSS Selector** - For targeting the element
   - **XPath** - Alternative selector
   - **Full Prompt** - Formatted info for AI assistants

This is useful for describing UI elements when working with AI coding assistants.

### Element Copy Dialog

When an element is selected, a dialog provides multiple copy options:

- **Quick Copy** buttons for CSS selector, XPath, or full prompt
- **Advanced Options** to customize which fields to include
- **Preview** of the formatted output

The full prompt format includes:

```
Page: http://localhost:3000/dashboard
Element: "Submit Button"
Selector: button.btn-primary
XPath: //button[@class="btn-primary"]
Tag: button
```

## i18n Integration

### With next-intl

```tsx
import { useTranslations } from 'next-intl'
import { DevTools, devtoolsMessages } from '@nextdevx/devtools'

// Add to your messages
// en.json: { "devMode": { ...devtoolsMessages.en } }

function Layout() {
  const t = useTranslations('devMode')
  return <DevTools t={t} />
}
```

### Without next-intl

```tsx
import { DevTools } from '@nextdevx/devtools'

<DevTools
  translations={{
    badge: 'ENTWICKLUNG',
    auth: 'Authentifizierung',
    notAuthenticated: 'Nicht angemeldet',
    // ... other translations
  }}
/>
```

### Default Messages

Import default messages to merge with your i18n setup:

```typescript
import { devtoolsMessages } from '@nextdevx/devtools'

// English and Dutch translations included
const messages = {
  ...devtoolsMessages.en,
  // your other messages
}
```

## Utilities

### isLocalhost

Check if the current environment is localhost:

```typescript
import { isLocalhost } from '@nextdevx/devtools'

if (isLocalhost()) {
  // Development-only code
}
```

## Migration from DevModeIndicator

`DevModeIndicator` has been renamed to `DevTools` and now includes additional features. The old component is deprecated but still works:

```tsx
// Before (deprecated)
import { DevModeIndicator } from '@nextdevx/devtools'
<DevModeIndicator />

// After (recommended)
import { DevTools } from '@nextdevx/devtools'
<DevTools />
```

## Security

- `DevTools` only renders on localhost by default (`localhostOnly={true}`)
- `DevLoginPage` is restricted to localhost access only
- Set `localhostOnly={false}` on DevTools if you want to show in staging environments (not recommended for production)

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `react` | >=18.0.0 | Yes |
| `react-dom` | >=18.0.0 | Yes |
| `next` | >=14.0.0 | Yes |
| `lucide-react` | >=0.300.0 | Yes |
| `next-intl` | >=3.0.0 | Optional |

## Dependencies

This package depends on `@nextdevx/core` for authentication context and element picker utilities.

## TypeScript

All exports are fully typed:

```typescript
import type {
  DevToolsProps,
  DevToolsTranslations,
  DevLoginPageProps,
  TestUser,
  TestUserCategory,
  IconName,
  BadgeColor,
} from '@nextdevx/devtools'
```

## License

MIT
