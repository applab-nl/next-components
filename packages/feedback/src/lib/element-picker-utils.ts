// Element Picker Utilities
// Provides functionality to generate selectors and friendly names for DOM elements

import type { ElementInfo } from '../types'

// =============================================================================
// Tailwind Class Filtering
// =============================================================================

// Common Tailwind prefixes to filter out
const TAILWIND_PREFIXES = [
  'bg-',
  'text-',
  'border-',
  'rounded-',
  'shadow-',
  'p-',
  'px-',
  'py-',
  'pt-',
  'pb-',
  'pl-',
  'pr-',
  'm-',
  'mx-',
  'my-',
  'mt-',
  'mb-',
  'ml-',
  'mr-',
  'w-',
  'h-',
  'min-',
  'max-',
  'flex-',
  'grid-',
  'col-',
  'row-',
  'gap-',
  'space-',
  'font-',
  'leading-',
  'tracking-',
  'align-',
  'justify-',
  'items-',
  'content-',
  'self-',
  'order-',
  'opacity-',
  'z-',
  'inset-',
  'top-',
  'right-',
  'bottom-',
  'left-',
  'translate-',
  'rotate-',
  'scale-',
  'skew-',
  'origin-',
  'cursor-',
  'select-',
  'resize-',
  'overflow-',
  'overscroll-',
  'scroll-',
  'snap-',
  'touch-',
  'pointer-',
  'focus:',
  'hover:',
  'active:',
  'disabled:',
  'group-',
  'peer-',
  'dark:',
  'sm:',
  'md:',
  'lg:',
  'xl:',
  '2xl:',
  'motion-',
  'animate-',
  'transition-',
  'duration-',
  'ease-',
  'delay-',
  'fill-',
  'stroke-',
  'sr-',
  'not-sr-',
  'divide-',
  'ring-',
  'outline-',
  'decoration-',
  'underline-',
  'line-',
  'list-',
  'placeholder-',
  'caret-',
  'accent-',
  'appearance-',
  'aspect-',
  'object-',
  'break-',
  'columns-',
  'auto-',
  'float-',
  'clear-',
  'isolation-',
  'whitespace-',
  'hyphens-',
  'filter-',
  'blur-',
  'brightness-',
  'contrast-',
  'drop-',
  'grayscale-',
  'hue-',
  'invert-',
  'saturate-',
  'sepia-',
  'backdrop-',
  'will-',
  'contain-',
  'mix-',
  'bg-gradient-',
  'from-',
  'via-',
  'to-',
  'text-opacity-',
  'bg-opacity-',
  'border-opacity-',
]

// Common Tailwind utility classes (standalone)
const TAILWIND_UTILITIES = new Set([
  'flex',
  'inline-flex',
  'block',
  'inline-block',
  'inline',
  'hidden',
  'visible',
  'invisible',
  'static',
  'fixed',
  'absolute',
  'relative',
  'sticky',
  'isolate',
  'isolation-auto',
  'container',
  'box-border',
  'box-content',
  'float-right',
  'float-left',
  'float-none',
  'clear-left',
  'clear-right',
  'clear-both',
  'clear-none',
  'object-contain',
  'object-cover',
  'object-fill',
  'object-none',
  'object-scale-down',
  'overflow-auto',
  'overflow-hidden',
  'overflow-visible',
  'overflow-scroll',
  'overflow-x-auto',
  'overflow-x-hidden',
  'overflow-x-visible',
  'overflow-x-scroll',
  'overflow-y-auto',
  'overflow-y-hidden',
  'overflow-y-visible',
  'overflow-y-scroll',
  'truncate',
  'text-ellipsis',
  'text-clip',
  'antialiased',
  'subpixel-antialiased',
  'italic',
  'not-italic',
  'normal-nums',
  'ordinal',
  'slashed-zero',
  'lining-nums',
  'oldstyle-nums',
  'proportional-nums',
  'tabular-nums',
  'diagonal-fractions',
  'stacked-fractions',
  'uppercase',
  'lowercase',
  'capitalize',
  'normal-case',
  'underline',
  'overline',
  'line-through',
  'no-underline',
  'sr-only',
  'not-sr-only',
  'resize-none',
  'resize-y',
  'resize-x',
  'resize',
  'list-inside',
  'list-outside',
  'list-none',
  'list-disc',
  'list-decimal',
  'appearance-none',
  'appearance-auto',
  'columns-auto',
  'break-after-auto',
  'break-before-auto',
  'break-inside-auto',
  'break-inside-avoid',
  'break-after-all',
  'break-normal',
  'break-words',
  'break-all',
  'whitespace-normal',
  'whitespace-nowrap',
  'whitespace-pre',
  'whitespace-pre-line',
  'whitespace-pre-wrap',
  'group',
  'peer',
  'contents',
  'flow-root',
  'table',
  'table-caption',
  'table-cell',
  'table-column',
  'table-column-group',
  'table-footer-group',
  'table-header-group',
  'table-row-group',
  'table-row',
  'grid',
  'inline-grid',
  'pointer-events-none',
  'pointer-events-auto',
  'touch-auto',
  'touch-none',
  'touch-pan-x',
  'touch-pan-left',
  'touch-pan-right',
  'touch-pan-y',
  'touch-pan-up',
  'touch-pan-down',
  'touch-pinch-zoom',
  'touch-manipulation',
  'select-none',
  'select-text',
  'select-all',
  'select-auto',
  'will-change-auto',
  'will-change-scroll',
  'will-change-contents',
  'will-change-transform',
  'snap-start',
  'snap-end',
  'snap-center',
  'snap-align-none',
  'snap-normal',
  'snap-always',
  'snap-none',
  'snap-x',
  'snap-y',
  'snap-both',
  'snap-mandatory',
  'snap-proximity',
])

/**
 * Check if a class name is a Tailwind utility class
 */
export function isTailwindClass(className: string): boolean {
  // Check exact match
  if (TAILWIND_UTILITIES.has(className)) {
    return true
  }

  // Check prefixes
  return TAILWIND_PREFIXES.some((prefix) => className.startsWith(prefix))
}

/**
 * Filter out Tailwind classes from a class list
 */
export function filterTailwindClasses(classes: string[]): string[] {
  return classes.filter((cls) => !isTailwindClass(cls))
}

// =============================================================================
// XPath Generation
// =============================================================================

/**
 * Generate an XPath expression for an element
 */
export function generateXPath(element: Element): string {
  // If element has a unique id, use it
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()

    // If element has an id, use it and stop
    if (current.id) {
      parts.unshift(`//*[@id="${current.id}"]`)
      break
    }

    // Count siblings of the same type
    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (child) => child.tagName === current!.tagName
        )
      : []

    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1
      selector += `[${index}]`
    }

    parts.unshift(selector)
    current = current.parentElement
  }

  // If we didn't hit an id, add the root
  const firstPart = parts[0]
  if (parts.length > 0 && firstPart && !firstPart.startsWith('//*')) {
    parts.unshift('')
  }

  return '/' + parts.join('/')
}

// =============================================================================
// CSS Selector Generation
// =============================================================================

/**
 * Generate a unique CSS selector for an element
 */
export function generateCssSelector(element: Element): string {
  // If element has a unique id, use it
  if (element.id) {
    return `#${CSS.escape(element.id)}`
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()

    // If element has an id, use it and stop
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    // Try to use meaningful non-Tailwind classes
    const classes = Array.from(current.classList)
    const meaningfulClasses = filterTailwindClasses(classes)

    if (meaningfulClasses.length > 0) {
      // Use at most 2 meaningful classes
      const classSelector = meaningfulClasses
        .slice(0, 2)
        .map((c) => `.${CSS.escape(c)}`)
        .join('')
      selector += classSelector

      // Check if this selector is unique among siblings
      const siblings = current.parentElement ? Array.from(current.parentElement.children) : []
      const matchingSiblings = siblings.filter((sibling) => sibling.matches(selector))

      if (matchingSiblings.length === 1) {
        parts.unshift(selector)
        current = current.parentElement
        continue
      }
    }

    // Fall back to nth-child if needed
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(current) + 1

      // Only add nth-child if there are multiple siblings of the same type
      const sameTypeSiblings = siblings.filter((s) => s.tagName === current!.tagName)
      if (sameTypeSiblings.length > 1) {
        selector += `:nth-child(${index})`
      }
    }

    parts.unshift(selector)
    current = current.parentElement
  }

  return parts.join(' > ')
}

// =============================================================================
// Friendly Name Generation
// =============================================================================

// Priority order for generating friendly names (12 levels)
const FRIENDLY_NAME_EXTRACTORS: Array<(el: Element) => string | null> = [
  // 1. aria-label attribute
  (el) => el.getAttribute('aria-label'),

  // 2. title attribute
  (el) => el.getAttribute('title'),

  // 3. alt attribute (for images)
  (el) => el.getAttribute('alt'),

  // 4. Button/link text content (only for interactive elements)
  (el) => {
    if (['BUTTON', 'A'].includes(el.tagName)) {
      const text = el.textContent?.trim()
      if (text && text.length <= 50) {
        return text
      }
    }
    return null
  },

  // 5. placeholder attribute (for inputs)
  (el) => el.getAttribute('placeholder'),

  // 6. name attribute
  (el) => el.getAttribute('name'),

  // 7. data-testid attribute
  (el) => {
    const testId = el.getAttribute('data-testid')
    if (testId) {
      // Convert kebab-case or snake_case to readable text
      return testId
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
    }
    return null
  },

  // 8. data-cy attribute (Cypress)
  (el) => {
    const cyId = el.getAttribute('data-cy')
    if (cyId) {
      return cyId.replace(/[-_]/g, ' ').toLowerCase()
    }
    return null
  },

  // 9. First meaningful class name (non-Tailwind)
  (el) => {
    const classes = Array.from(el.classList)
    const meaningful = filterTailwindClasses(classes)
    const firstClass = meaningful[0]
    if (firstClass) {
      // Convert class name to readable text
      return firstClass
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
    }
    return null
  },

  // 10. id attribute (cleaned up)
  (el) => {
    if (el.id) {
      return el.id
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
    }
    return null
  },

  // 11. Short text content (for any element)
  (el) => {
    // Don't include text from input elements
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
      return null
    }

    // Get direct text content (not from children)
    const directText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .join(' ')
      .trim()

    if (directText && directText.length <= 30) {
      return directText
    }

    // If no direct text, try first child's text
    const firstChildText = el.firstElementChild?.textContent?.trim()
    if (firstChildText && firstChildText.length <= 30) {
      return firstChildText
    }

    return null
  },

  // 12. role attribute + tag name
  (el) => {
    const role = el.getAttribute('role')
    if (role) {
      return `${role} (${el.tagName.toLowerCase()})`
    }
    return null
  },
]

/**
 * Generate a human-friendly name for an element
 */
export function generateFriendlyName(element: Element): string {
  for (const extractor of FRIENDLY_NAME_EXTRACTORS) {
    const name = extractor(element)
    if (name) {
      // Truncate if too long
      return name.length > 60 ? name.substring(0, 57) + '...' : name
    }
  }

  // Fallback: tag name
  return `<${element.tagName.toLowerCase()}>`
}

// =============================================================================
// Combined Element Info
// =============================================================================

/**
 * Generate complete element information for feedback
 */
export function getElementInfo(element: Element): ElementInfo {
  return {
    friendlyName: generateFriendlyName(element),
    cssSelector: generateCssSelector(element),
    xpath: generateXPath(element),
    tagName: element.tagName.toLowerCase(),
  }
}

// =============================================================================
// Element Lookup
// =============================================================================

/**
 * Find an element by its selector (tries CSS selector first, then XPath)
 */
export function findElementBySelector(
  cssSelector: string | null,
  xpath: string | null
): Element | null {
  // Try CSS selector first
  if (cssSelector) {
    try {
      const element = document.querySelector(cssSelector)
      if (element) return element
    } catch {
      // Invalid selector, try XPath
    }
  }

  // Try XPath
  if (xpath) {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      if (result.singleNodeValue instanceof Element) {
        return result.singleNodeValue
      }
    } catch {
      // Invalid XPath
    }
  }

  return null
}

// =============================================================================
// Utilities for Element Picker UI
// =============================================================================

/**
 * Check if an element should be excluded from selection
 * (e.g., the picker overlay itself, body, html)
 */
export function shouldExcludeElement(element: Element): boolean {
  // Exclude html and body
  if (element.tagName === 'HTML' || element.tagName === 'BODY') {
    return true
  }

  // Exclude elements with feedback-related data attributes
  if (element.hasAttribute('data-feedback-picker')) {
    return true
  }

  // Check parent chain for picker overlay
  let current: Element | null = element
  while (current) {
    if (current.hasAttribute('data-feedback-picker-overlay')) {
      return true
    }
    current = current.parentElement
  }

  return false
}

/**
 * Get bounding rect relative to viewport
 */
export function getElementBounds(element: Element): DOMRect {
  return element.getBoundingClientRect()
}
