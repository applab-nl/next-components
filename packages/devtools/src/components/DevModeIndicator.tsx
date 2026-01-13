'use client'

import { useEffect, useRef } from 'react'
import { DevTools, type DevToolsProps, type DevToolsTranslations } from './DevTools'

/**
 * @deprecated Use DevTools instead. DevModeIndicator will be removed in a future version.
 *
 * DevModeIndicator has been renamed to DevTools and now includes additional features
 * like the element picker for copying element info to clipboard.
 */
export type DevModeIndicatorTranslations = DevToolsTranslations

/**
 * @deprecated Use DevToolsProps instead. DevModeIndicatorProps will be removed in a future version.
 */
export type DevModeIndicatorProps = Omit<DevToolsProps, 'enablePromptCopier' | 'promptCopierShortcut'>

/**
 * @deprecated Use DevTools instead. DevModeIndicator will be removed in a future version.
 *
 * This component is a wrapper around DevTools for backwards compatibility.
 * It logs a deprecation warning once per component instance.
 */
export function DevModeIndicator(props: DevModeIndicatorProps) {
  const hasWarned = useRef(false)

  useEffect(() => {
    if (!hasWarned.current && process.env.NODE_ENV === 'development') {
      console.warn(
        '[DevModeIndicator] DevModeIndicator is deprecated. Use DevTools instead.\n' +
          'DevTools includes all the same features plus a "Copy Element" button for AI prompts.\n' +
          'See: https://github.com/your-org/nextstack/blob/main/packages/devtools/README.md'
      )
      hasWarned.current = true
    }
  }, [])

  // Pass through all props, but enable prompt copier by default for consistency
  return <DevTools {...props} />
}

DevModeIndicator.displayName = 'DevModeIndicator'
