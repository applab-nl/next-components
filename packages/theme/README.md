# @nextdevx/theme

Lightweight theme provider for Next.js applications supporting light, dark, and system modes with localStorage persistence and optional database sync.

## Features

- **Light/Dark/System Modes** - Full support for light, dark, and system-preference themes
- **localStorage Persistence** - Theme preference saved locally for instant restoration
- **System Theme Detection** - Automatically detect and respond to OS theme changes
- **Profile Sync** - Optional sync with user profile in database
- **SSR Safe** - Proper hydration handling to prevent flash of wrong theme
- **Zero Dependencies** - Only requires React and lucide-react for icons

## Installation

```bash
npm install @nextdevx/theme
# or
pnpm add @nextdevx/theme
# or
yarn add @nextdevx/theme
```

## Quick Start

### 1. Add the Provider

```tsx
// app/layout.tsx
import { ThemeProvider } from '@nextdevx/theme'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Add CSS Variables

Ensure your CSS supports dark mode. With Tailwind CSS:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Tailwind handles dark: automatically via class */
```

Or with custom CSS:

```css
:root {
  --background: #ffffff;
  --foreground: #000000;
}

.dark {
  --background: #000000;
  --foreground: #ffffff;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### 3. Add Theme Toggle

```tsx
import { ThemeToggle } from '@nextdevx/theme'

export function Header() {
  return (
    <header>
      <nav>{/* ... */}</nav>
      <ThemeToggle />
    </header>
  )
}
```

## API Reference

### ThemeProvider

Root provider for theme management.

```tsx
import { ThemeProvider } from '@nextdevx/theme'

<ThemeProvider
  defaultTheme="system"
  storageKey="my-app-theme"
  enableSystemTheme={true}
  onThemeChange={(theme) => console.log('Theme changed:', theme)}
  initialTheme={userProfile?.theme}
>
  {children}
</ThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | **required** | Child components |
| `defaultTheme` | `Theme` | `'system'` | Default theme when no preference is saved |
| `storageKey` | `string` | `'nextstack-theme'` | localStorage key for persistence |
| `enableSystemTheme` | `boolean` | `true` | Allow system theme option |
| `onThemeChange` | `(theme: Theme) => void` | - | Callback when theme changes |
| `initialTheme` | `Theme` | - | Initial theme from server (e.g., user profile) |

### ThemeToggle

Pre-built theme toggle button.

```tsx
import { ThemeToggle } from '@nextdevx/theme'

// Icon button (cycles through themes on click)
<ThemeToggle />

// With label
<ThemeToggle variant="dropdown" />

// Without system option
<ThemeToggle showSystemOption={false} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'icon' \| 'dropdown'` | `'icon'` | Toggle style |
| `showSystemOption` | `boolean` | `true` | Include system theme in cycle |
| `className` | `string` | `''` | Additional CSS classes |

The toggle cycles through themes: **light → dark → system → light** (or **light → dark → light** if `showSystemOption` is false).

### useTheme

Hook to access theme context.

```typescript
import { useTheme } from '@nextdevx/theme'

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark' (actual computed value)
  // setTheme: function to change theme

  return (
    <div>
      <p>Current setting: {theme}</p>
      <p>Actual theme: {resolvedTheme}</p>

      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}
```

#### Return Value

```typescript
interface ThemeContextValue {
  /** Current theme setting ('light', 'dark', or 'system') */
  theme: Theme
  /** Resolved theme value ('light' or 'dark') */
  resolvedTheme: ResolvedTheme
  /** Function to change the theme */
  setTheme: (theme: Theme) => void
}
```

### ProfileThemeSync

Component for syncing theme with user profile in database.

```tsx
import { ProfileThemeSync } from '@nextdevx/theme'

function MyProfileThemeSync() {
  const { user } = useAuth()
  const { data: profile, isSuccess } = useProfile()

  const updateTheme = async (theme: Theme) => {
    await fetch('/api/profile/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
  }

  return (
    <ProfileThemeSync
      user={user}
      profileTheme={profile?.themePreference}
      onProfileThemeUpdate={updateTheme}
      isProfileLoaded={isSuccess}
    />
  )
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `{ id: string } \| null` | **required** | Current user object |
| `profileTheme` | `Theme \| null` | **required** | Theme from user profile |
| `onProfileThemeUpdate` | `(theme: Theme) => void` | **required** | Callback to update profile |
| `isProfileLoaded` | `boolean` | `true` | Whether profile data is loaded |

#### Behavior

1. **On login**: Syncs profile theme → local state
2. **On theme change**: Updates profile (if logged in)
3. **On logout**: Resets sync state

## Types

```typescript
type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableSystemTheme?: boolean
  onThemeChange?: (theme: Theme) => void
  initialTheme?: Theme
}

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

interface ProfileThemeSyncProps {
  user: { id: string } | null | undefined
  profileTheme: Theme | null | undefined
  onProfileThemeUpdate: (theme: Theme) => void
  isProfileLoaded?: boolean
}
```

## Usage Examples

### Custom Theme Toggle

```tsx
import { useTheme } from '@nextdevx/theme'
import { Sun, Moon, Monitor } from 'lucide-react'

function CustomToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('light')}
        className={theme === 'light' ? 'bg-blue-500 text-white' : ''}
      >
        <Sun />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={theme === 'dark' ? 'bg-blue-500 text-white' : ''}
      >
        <Moon />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={theme === 'system' ? 'bg-blue-500 text-white' : ''}
      >
        <Monitor />
      </button>
    </div>
  )
}
```

### With Server-Side Initial Theme

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'
import { ThemeProvider } from '@nextdevx/theme'

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value as Theme | undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider initialTheme={themeCookie}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Theme-Aware Components

```tsx
import { useTheme } from '@nextdevx/theme'

function Logo() {
  const { resolvedTheme } = useTheme()

  return (
    <img
      src={resolvedTheme === 'dark' ? '/logo-white.svg' : '/logo-black.svg'}
      alt="Logo"
    />
  )
}
```

### With React Query Profile Sync

```tsx
import { ProfileThemeSync } from '@nextdevx/theme'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function ProfileThemeSyncWrapper() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isSuccess } = useQuery({
    queryKey: ['profile'],
    queryFn: () => fetch('/api/profile').then(r => r.json()),
    enabled: !!user,
  })

  const mutation = useMutation({
    mutationFn: (theme: Theme) =>
      fetch('/api/profile/theme', {
        method: 'PATCH',
        body: JSON.stringify({ theme }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return (
    <ProfileThemeSync
      user={user}
      profileTheme={profile?.themePreference}
      onProfileThemeUpdate={mutation.mutate}
      isProfileLoaded={isSuccess}
    />
  )
}
```

## Flash Prevention

To prevent a flash of wrong theme on page load, add `suppressHydrationWarning` to your `<html>` tag and consider adding an inline script:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('nextstack-theme') || 'system';
                const resolved = theme === 'system'
                  ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                  : theme;
                document.documentElement.classList.add(resolved);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `react` | >=18.0.0 | Yes |
| `lucide-react` | >=0.300.0 | Yes |

## TypeScript

All exports are fully typed:

```typescript
import type {
  Theme,
  ResolvedTheme,
  ThemeProviderProps,
  ThemeContextValue,
  ProfileThemeSyncProps,
} from '@nextdevx/theme'
```

## License

MIT
