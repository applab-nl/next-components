# @nextdevx/whats-new

Changelog / release notes component for Next.js applications with voting, new entry highlighting, and feedback linking.

## Features

- **Changelog Dialog** - Beautiful modal displaying release notes and updates
- **New Entry Highlighting** - Automatically highlights entries since user's last visit
- **Voting System** - Users can upvote/downvote entries
- **Feedback Linking** - Link changelog entries to user feedback that inspired them
- **Vote Propagation** - Optionally propagate votes to linked feedback items
- **Admin Support** - Create and manage entries via admin subpath
- **Dark Mode** - Full light/dark theme support
- **i18n Ready** - Optional next-intl integration

## Installation

```bash
npm install @nextdevx/whats-new
# or
pnpm add @nextdevx/whats-new
# or
yarn add @nextdevx/whats-new
```

## Quick Start

### 1. Add Prisma Models

Copy the schema from `node_modules/@nextdevx/whats-new/prisma/schema.prisma` to your project:

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
}

model WhatsNewFeedbackLink {
  id         String   @id @default(cuid())
  entryId    String
  feedbackId String
  createdBy  String?
  createdAt  DateTime @default(now())
  entry      WhatsNewEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, feedbackId])
}

model WhatsNewUserVisit {
  id            String   @id @default(cuid())
  userId        String   @unique
  lastVisitedAt DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Run migrations:

```bash
npx prisma migrate dev --name add-whats-new
```

### 2. Create API Routes

```typescript
// app/api/whats-new/route.ts
import { NextResponse } from 'next/server'
import { createWhatsNewService } from '@nextdevx/whats-new'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const service = createWhatsNewService(prisma, auth)
  const entries = await service.getEntries()
  return NextResponse.json({ entries })
}
```

```typescript
// app/api/whats-new/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createWhatsNewService } from '@nextdevx/whats-new'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  const { voteType } = await request.json()

  const service = createWhatsNewService(prisma, auth, {
    enableVotePropagation: true, // Optional: propagate votes to linked feedback
  })

  try {
    const result = await service.vote(id, voteType)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vote' },
      { status: 400 }
    )
  }
}
```

### 3. Add Components

```tsx
// components/WhatsNewButton.tsx
'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { WhatsNewDialog, WhatsNewBadge, useHasNewEntries } from '@nextdevx/whats-new'

export function WhatsNewButton() {
  const [open, setOpen] = useState(false)
  const hasNew = useHasNewEntries()

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2">
        <Sparkles className="h-5 w-5" />
        {hasNew && <WhatsNewBadge />}
      </button>

      <WhatsNewDialog
        open={open}
        onOpenChange={setOpen}
        enableVoting={true}
        showLinkedFeedbackCount={true}
      />
    </>
  )
}
```

## API Reference

### Components

#### WhatsNewDialog

Modal dialog displaying changelog entries.

```tsx
import { WhatsNewDialog } from '@nextdevx/whats-new'

<WhatsNewDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  enableVoting={true}
  showLinkedFeedbackCount={true}
  className="custom-class"
/>
```

##### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Callback when open state changes |
| `enableVoting` | `boolean` | `true` | Enable voting on entries |
| `showLinkedFeedbackCount` | `boolean` | `true` | Show count of linked feedback |
| `className` | `string` | `''` | Additional CSS classes |

#### WhatsNewBadge

Notification badge indicating new entries.

```tsx
import { WhatsNewBadge } from '@nextdevx/whats-new'

<button className="relative">
  <Sparkles />
  <WhatsNewBadge /> {/* Shows dot if there are new entries */}
</button>
```

### Hooks

#### useWhatsNew

Hook for fetching entries and voting.

```typescript
import { useWhatsNew } from '@nextdevx/whats-new'

function MyComponent() {
  const {
    entries,      // WhatsNewEntry[]
    isLoading,    // boolean
    error,        // string | null
    refetch,      // () => Promise<void>
    vote,         // (entryId, voteType) => Promise<VoteResult>
  } = useWhatsNew('/api/whats-new')

  const handleVote = async (entryId: string) => {
    const result = await vote(entryId, 'up')
    console.log('New counts:', result.upvotes, result.downvotes)
  }

  return (
    <div>
      {entries.map((entry) => (
        <div key={entry.id}>
          <h3>{entry.title}</h3>
          <p>{entry.summary}</p>
          <span>{entry.upvotes} upvotes</span>
          <button onClick={() => handleVote(entry.id)}>
            {entry.currentUserVote === 'up' ? 'Voted!' : 'Upvote'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

#### useHasNewEntries

Hook to check if there are new entries since last visit.

```typescript
import { useHasNewEntries } from '@nextdevx/whats-new'

function NotificationBadge() {
  const hasNew = useHasNewEntries()

  if (!hasNew) return null

  return <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
}
```

### Services

#### createWhatsNewService

Factory function to create a backend service.

```typescript
import { createWhatsNewService } from '@nextdevx/whats-new'

const service = createWhatsNewService(prisma, auth, {
  enableVotePropagation: true,
})

// Get all published entries
const entries = await service.getEntries()

// Vote on an entry
const result = await service.vote(entryId, 'up')  // or 'down' or null
// result: { upvotes: number, downvotes: number }

// Create a new entry (admin)
const entry = await service.createEntry({
  date: '2024-01-15',
  title: 'New Feature: Dark Mode',
  summary: 'We added dark mode support!',
  content: '## Details\n\nFull markdown content here...',
  isPublished: true,
})
```

##### Options

```typescript
interface WhatsNewServiceOptions {
  /**
   * Enable vote propagation to linked feedback items.
   * When enabled, votes on What's New entries will also update
   * the voteScore of linked feedback items and their authors' feedbackScore.
   */
  enableVotePropagation?: boolean
}
```

## Types

```typescript
import type {
  WhatsNewEntry,
  WhatsNewVote,
  WhatsNewFeedbackLink,
  WhatsNewDialogProps,
  UseWhatsNewReturn,
  VoteResult,
  WhatsNewService,
  WhatsNewServiceOptions,
  CreateEntryInput,
} from '@nextdevx/whats-new'
```

### Key Types

```typescript
interface WhatsNewEntry {
  id: string
  date: Date
  title: string
  summary: string
  content: string | null       // Markdown for detailed view
  isPublished: boolean
  upvotes: number
  downvotes: number
  linkedFeedbackCount?: number
  createdAt: Date
  updatedAt: Date
  currentUserVote?: 'up' | 'down' | null
}

interface VoteResult {
  upvotes: number
  downvotes: number
}

interface CreateEntryInput {
  date: string       // YYYY-MM-DD format
  title: string
  summary: string
  content?: string   // Markdown
  isPublished?: boolean
}
```

## Features in Detail

### New Entry Highlighting

The dialog automatically tracks when users last viewed the changelog using localStorage. Entries created since the last visit are highlighted with a "New" badge. When the dialog closes, the last visit timestamp is updated.

### Vote Propagation

When `enableVotePropagation` is enabled and entries are linked to feedback items:

1. Upvoting an entry increases `voteScore` on all linked feedback items
2. Feedback authors' `feedbackScore` is also increased
3. Downvotes work similarly but decrease scores
4. Changing or removing votes properly reverses previous changes

This creates a connection between feature releases and the user feedback that inspired them.

### Feedback Linking

Link feedback items to changelog entries to show attribution:

```typescript
// Create link between feedback and what's new entry
await prisma.whatsNewFeedbackLink.create({
  data: {
    entryId: whatsNewEntryId,
    feedbackId: feedbackId,
    createdBy: adminUserId,
  },
})
```

The dialog can show the count of linked feedback items for each entry.

## i18n Integration

### With next-intl

```tsx
import { useTranslations } from 'next-intl'
import { WhatsNewDialog, whatsNewMessages } from '@nextdevx/whats-new'

// Add messages to your locale files
const messages = {
  whatsNew: whatsNewMessages.en,
}

function WhatsNew() {
  const t = useTranslations('whatsNew')
  return <WhatsNewDialog t={t} />
}
```

### Default Messages

```typescript
import { whatsNewMessages } from '@nextdevx/whats-new'

// Available: whatsNewMessages.en, whatsNewMessages.nl
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `react` | >=18.0.0 | Yes |
| `react-dom` | >=18.0.0 | Yes |
| `next` | >=14.0.0 | Yes |
| `@prisma/client` | >=5.0.0 | Yes |
| `lucide-react` | >=0.300.0 | Yes |
| `next-intl` | >=3.0.0 | Optional |

## License

MIT
