// @nextdevx/whats-new - Changelog with voting

// Components
export { WhatsNewDialog } from './components/WhatsNewDialog'
export type { WhatsNewDialogProps } from './components/WhatsNewDialog'
export { WhatsNewBadge } from './components/WhatsNewBadge'

// Hooks
export { useWhatsNew } from './hooks/useWhatsNew'
export type { UseWhatsNewReturn, VoteResult } from './hooks/useWhatsNew'
export { useHasNewEntries } from './hooks/useHasNewEntries'

// Services
export { createWhatsNewService } from './services/whats-new-service'
export type {
  WhatsNewService,
  WhatsNewServiceOptions,
  CreateEntryInput,
} from './services/whats-new-service'

// Types
export type { WhatsNewEntry, WhatsNewVote } from './types'

// i18n
export { whatsNewMessages } from './i18n/messages'
