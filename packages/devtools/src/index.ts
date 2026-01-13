// @nextstack/devtools - Developer experience tools

// Components
export { DevTools } from './components/DevTools'
export type { DevToolsProps, DevToolsTranslations } from './components/DevTools'
export { DevLoginPage } from './components/DevLoginPage'

// Deprecated - use DevTools instead
export { DevModeIndicator } from './components/DevModeIndicator'
export type {
  DevModeIndicatorProps,
  DevModeIndicatorTranslations,
} from './components/DevModeIndicator'

// Configuration
export { defineTestUsers } from './config/test-users'
export type { TestUser, TestUserCategory } from './config/test-users'

// i18n
export { devtoolsMessages } from './i18n/messages'

// Utils
export { isLocalhost } from './utils/environment'
