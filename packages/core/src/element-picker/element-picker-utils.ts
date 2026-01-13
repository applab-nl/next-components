/**
 * Element Picker Utilities
 *
 * Provides functionality to generate selectors and friendly names for DOM elements.
 * Features advanced name generation with caching, performance metrics, and
 * comprehensive strategies for identifying element purposes.
 */

import type { ElementInfo } from './types'

// =============================================================================
// Performance Metrics and Caching
// =============================================================================

// Cache for friendly names using WeakMap for automatic garbage collection
const nameCache = new WeakMap<Element, string>()

// Cache for label associations (id -> label text)
const labelCache = new Map<string, string | null>()

// Performance metrics (only tracked in development)
interface PerformanceMetrics {
  totalCalls: number
  cacheHits: number
  totalTime: number
  maxTime: number
  avgTime: number
}

const performanceMetrics: PerformanceMetrics = {
  totalCalls: 0,
  cacheHits: 0,
  totalTime: 0,
  maxTime: 0,
  avgTime: 0,
}

/**
 * Get performance metrics for name generation.
 * Useful for debugging and optimization.
 */
export function getNameGenerationMetrics(): PerformanceMetrics {
  return { ...performanceMetrics }
}

/**
 * Reset performance metrics.
 */
export function resetNameGenerationMetrics(): void {
  performanceMetrics.totalCalls = 0
  performanceMetrics.cacheHits = 0
  performanceMetrics.totalTime = 0
  performanceMetrics.maxTime = 0
  performanceMetrics.avgTime = 0
}

/**
 * Clear all caches (useful for testing or when DOM changes significantly).
 */
export function clearNameCaches(): void {
  // WeakMap doesn't have a clear method, but entries are automatically
  // garbage collected when elements are removed from DOM
  labelCache.clear()
}

// =============================================================================
// Utility Class Detection
// =============================================================================

/**
 * Check if a class name is a utility class (Tailwind, etc.)
 * These are less meaningful for identification
 */
function isUtilityClass(className: string): boolean {
  // Common Tailwind/utility patterns
  // Note: These patterns must be precise to avoid matching semantic class names
  const utilityPatterns = [
    // Spacing: m-4, mt-2, mx-auto, p-4, px-2, -m-1, etc.
    // Note: Only match when followed by a number, 'auto', 'px', or 'full'
    /^-?[mp][xytblrs]?-(\d|auto|px|full|screen)/,
    // Sizing: w-full, h-screen, min-w-0, max-h-96
    /^(w|h|min-w|max-w|min-h|max-h)-/,
    // Positioning: top-0, left-1/2, inset-0
    /^(top|left|right|bottom|inset)-/,
    // Spacing between: space-x-4, gap-4
    /^(space-[xy]|gap)-/,
    // Colors and styling: text-red-500, bg-blue-100, border-gray-200
    /^(text|bg|border|rounded|shadow|ring|outline)-/,
    // Flexbox: flex-1, items-center, justify-between
    /^(items|justify|content|place|self)-/,
    // Typography: font-bold, text-lg, tracking-wide
    /^(font|tracking|leading|decoration|underline|line)-/,
    // Layout utilities: overflow-hidden, z-10
    /^(overflow|object|aspect|z|opacity)-/,
    // Transitions: transition-all, duration-300
    /^(transition|duration|ease|delay|animate)-/,
    // Display (standalone): hidden, block, flex, grid, inline, table
    /^(hidden|block|inline-block|inline-flex|inline-grid|inline|flex|grid|table|contents|flow-root|list-item)$/,
    // Position (standalone): absolute, relative, fixed, sticky, static
    /^(absolute|relative|fixed|sticky|static)$/,
    // Visibility: visible, invisible, sr-only
    /^(visible|invisible|sr-only|not-sr-only|collapse)$/,
    // Responsive prefixes: sm:, md:, lg:, xl:, 2xl:
    /^(sm|md|lg|xl|2xl):/,
    // State prefixes: hover:, focus:, active:, disabled:
    /^(hover|focus|active|disabled|group-hover|peer-hover|focus-within|focus-visible):/,
    // Theme: dark:, light:
    /^(dark|light):/,
    // Grid: col-span-2, row-start-1
    /^(col|row)-/,
    // Interaction: cursor-pointer, select-none
    /^(cursor|pointer-events|select|resize|scroll)-/,
    // SVG: fill-current, stroke-2
    /^(fill|stroke)-/,
    // Gradients: from-blue-500, via-purple-500, to-pink-500
    /^(from|via|to)-/,
    // Transforms: scale-95, rotate-45, translate-x-1
    /^(scale|rotate|translate|skew|origin)-/,
    // Flex item properties: shrink-0, grow, basis-full
    /^(shrink|grow|basis|order)-/,
    // Text handling: break-words, whitespace-nowrap, truncate
    /^(break|whitespace|truncate|hyphens)-/,
    // Special standalone utilities
    /^(container|prose|antialiased|subpixel-antialiased)$/,
  ]

  return utilityPatterns.some((pattern) => pattern.test(className))
}

/**
 * Filter out utility classes from a class list
 */
export function filterTailwindClasses(classes: string[]): string[] {
  return classes.filter((cls) => !isUtilityClass(cls))
}

// =============================================================================
// Text Utilities
// =============================================================================

// Maximum length for text content portion of friendly names
const MAX_TEXT_LENGTH = 50

/**
 * Sanitize and normalize text for display.
 * Removes excessive whitespace, HTML entities, and normalizes spaces.
 */
function sanitizeText(text: string): string {
  return text
    .replace(/[\n\r\t]+/g, ' ') // Replace newlines/tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
}

/**
 * Truncate text at word boundaries with ellipsis.
 * Preserves whole words and adds "..." when truncated.
 */
function truncateText(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  // If there's a space, truncate at word boundary
  if (lastSpace > maxLength * 0.5) {
    return truncated.substring(0, lastSpace) + '...'
  }

  // Otherwise, just truncate at maxLength
  return truncated + '...'
}

/**
 * Convert identifier (kebab-case, camelCase, snake_case) to human readable text.
 */
function humanizeIdentifier(str: string): string {
  return str
    // Insert space before uppercase letters (camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace hyphens and underscores with spaces
    .replace(/[-_]+/g, ' ')
    // Capitalize first letter of each word
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

// =============================================================================
// XPath Generation
// =============================================================================

/**
 * Escape special characters in XPath string values.
 * Handles quotes by using concat() when both quote types are present.
 */
function escapeXPathString(str: string): string {
  // If no quotes, wrap in double quotes
  if (!str.includes('"')) {
    return `"${str}"`
  }
  // If no single quotes, wrap in single quotes
  if (!str.includes("'")) {
    return `'${str}'`
  }
  // If both types of quotes, use concat()
  const parts: string[] = []
  let remaining = str
  while (remaining.length > 0) {
    const doubleQuoteIndex = remaining.indexOf('"')
    const singleQuoteIndex = remaining.indexOf("'")

    if (doubleQuoteIndex === -1) {
      parts.push(`"${remaining}"`)
      break
    } else if (singleQuoteIndex === -1) {
      parts.push(`'${remaining}'`)
      break
    } else if (doubleQuoteIndex < singleQuoteIndex) {
      if (doubleQuoteIndex > 0) {
        parts.push(`"${remaining.substring(0, doubleQuoteIndex)}"`)
      }
      parts.push(`'"'`)
      remaining = remaining.substring(doubleQuoteIndex + 1)
    } else {
      if (singleQuoteIndex > 0) {
        parts.push(`"${remaining.substring(0, singleQuoteIndex)}"`)
      }
      parts.push(`"'"`)
      remaining = remaining.substring(singleQuoteIndex + 1)
    }
  }
  return `concat(${parts.join(',')})`
}

/**
 * Generate an XPath expression for an element
 */
export function generateXPath(element: Element): string {
  // If element has a unique ID, use it for a shorter, more stable path
  if (element.id) {
    return `//*[@id=${escapeXPathString(element.id)}]`
  }

  // Build path from root
  const parts: string[] = []
  let current: Element | null = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling: Element | null = current.previousElementSibling

    // Count previous siblings with the same tag name
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    const tagName = current.tagName.toLowerCase()
    parts.unshift(`${tagName}[${index}]`)
    current = current.parentElement
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
  // If element has an ID, use it
  if (element.id) {
    return `#${CSS.escape(element.id)}`
  }

  const parts: string[] = []
  let current: Element | null = element

  // Walk up the tree, building selector parts
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const tagName = current.tagName.toLowerCase()

    // Skip html and body
    if (tagName === 'html' || tagName === 'body') {
      break
    }

    let selector = tagName

    // Add ID if present
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break // ID is unique enough
    }

    // Add meaningful classes (skip utility classes)
    const classes = Array.from(current.classList)
      .filter((cls) => !isUtilityClass(cls))
      .slice(0, 2) // Limit to 2 classes for readability

    if (classes.length > 0) {
      selector += '.' + classes.map((c) => CSS.escape(c)).join('.')
    }

    // Add nth-of-type if needed for uniqueness among same-tag siblings
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }

    parts.unshift(selector)
    current = current.parentElement

    // Limit depth for readability
    if (parts.length >= 4) {
      break
    }
  }

  return parts.join(' > ')
}

// =============================================================================
// Type/Role Detection
// =============================================================================

/**
 * Get type suffix for an element based on its tag and role.
 */
function getTypeSuffix(element: Element): string {
  const tagName = element.tagName.toLowerCase()
  const role = element.getAttribute('role')

  // Priority: explicit role > tag-based type
  if (role) {
    const roleSuffixes: Record<string, string> = {
      button: 'Button',
      link: 'Link',
      textbox: 'Input',
      checkbox: 'Checkbox',
      radio: 'Radio Button',
      switch: 'Toggle',
      slider: 'Slider',
      tab: 'Tab',
      tabpanel: 'Tab Panel',
      menu: 'Menu',
      menuitem: 'Menu Item',
      dialog: 'Dialog',
      alert: 'Alert',
      alertdialog: 'Alert Dialog',
      navigation: 'Navigation',
      main: 'Main Content',
      complementary: 'Sidebar',
      banner: 'Header',
      contentinfo: 'Footer',
      form: 'Form',
      search: 'Search',
      region: 'Section',
      article: 'Article',
      listitem: 'List Item',
      img: 'Image',
      figure: 'Figure',
      table: 'Table',
      row: 'Row',
      cell: 'Cell',
      columnheader: 'Column Header',
      rowheader: 'Row Header',
      grid: 'Grid',
      treegrid: 'Tree Grid',
      progressbar: 'Progress Bar',
      tooltip: 'Tooltip',
    }
    if (roleSuffixes[role]) return roleSuffixes[role]
  }

  // Tag-based suffixes
  const tagSuffixes: Record<string, string> = {
    button: 'Button',
    a: 'Link',
    input: 'Input',
    textarea: 'Text Area',
    select: 'Dropdown',
    img: 'Image',
    video: 'Video',
    audio: 'Audio',
    iframe: 'Frame',
    form: 'Form',
    table: 'Table',
    thead: 'Table Header',
    tbody: 'Table Body',
    tr: 'Row',
    th: 'Column Header',
    td: 'Cell',
    ul: 'List',
    ol: 'Numbered List',
    li: 'List Item',
    nav: 'Navigation',
    header: 'Header',
    footer: 'Footer',
    main: 'Main Content',
    aside: 'Sidebar',
    section: 'Section',
    article: 'Article',
    figure: 'Figure',
    figcaption: 'Caption',
    dialog: 'Dialog',
    details: 'Details',
    summary: 'Summary',
    h1: 'Heading',
    h2: 'Heading',
    h3: 'Heading',
    h4: 'Heading',
    h5: 'Heading',
    h6: 'Heading',
    label: 'Label',
    fieldset: 'Field Group',
    legend: 'Legend',
    progress: 'Progress Bar',
    meter: 'Meter',
    canvas: 'Canvas',
    svg: 'Graphic',
  }

  return tagSuffixes[tagName] || ''
}

/**
 * Get input type description for form elements.
 */
function getInputTypeDescription(element: Element): string | null {
  const tagName = element.tagName.toLowerCase()

  if (tagName === 'input') {
    const input = element as HTMLInputElement
    const type = input.type.toLowerCase()

    const typeDescriptions: Record<string, string> = {
      text: 'Text Field',
      email: 'Email Field',
      password: 'Password Field',
      number: 'Number Field',
      tel: 'Phone Field',
      url: 'URL Field',
      search: 'Search Field',
      date: 'Date Picker',
      time: 'Time Picker',
      datetime: 'Date/Time Picker',
      'datetime-local': 'Date/Time Picker',
      month: 'Month Picker',
      week: 'Week Picker',
      color: 'Color Picker',
      range: 'Range Slider',
      file: 'File Upload',
      checkbox: 'Checkbox',
      radio: 'Radio Option',
      submit: 'Submit Button',
      button: 'Button',
      reset: 'Reset Button',
      image: 'Image Button',
      hidden: 'Hidden Field',
    }

    return typeDescriptions[type] || 'Input Field'
  }

  if (tagName === 'textarea') {
    return 'Text Area'
  }

  if (tagName === 'select') {
    const select = element as HTMLSelectElement
    return select.multiple ? 'Multi-Select Dropdown' : 'Dropdown'
  }

  return null
}

// =============================================================================
// Aria and Label Extraction
// =============================================================================

/**
 * Check if a string describes function rather than content/value.
 * Functional descriptions typically contain action verbs or are field labels.
 */
function isFunctionalDescription(text: string): boolean {
  const lowerText = text.toLowerCase()

  // Action words that indicate function
  const actionPatterns = [
    /^(submit|save|cancel|close|open|add|remove|delete|edit|update|create|search|filter|sort|clear|reset|confirm|apply|send|download|upload|export|import|copy|paste|undo|redo|refresh|reload|expand|collapse|show|hide|toggle|enable|disable|select|deselect|check|uncheck|play|pause|stop|mute|unmute|next|previous|back|forward|go|navigate|scroll|zoom|print|share|like|follow|subscribe|login|logout|sign|register)/i,
    // Common UI patterns
    /\b(button|menu|dropdown|modal|dialog|popup|tooltip|tab|panel|sidebar|header|footer|nav|form|field|input|checkbox|radio|switch|slider|picker|selector|chooser|browser|viewer|editor|manager|settings|preferences|options|configuration)\b/i,
    // Field labels (short, descriptive)
    /^(name|email|password|username|phone|address|city|state|zip|country|date|time|amount|price|quantity|description|title|subject|message|comment|note|tag|category|type|status|priority|size|color|url|link|file|image|avatar|profile|account|user|admin|member|guest|role|permission|action|view|details|info|summary|overview|preview|main|content|section|area|region|zone|block|container|wrapper|group|list|item|row|column|cell|grid|card|box|banner|alert|notification|badge|icon|logo|image|photo|picture|video|audio|media|document|attachment|download|upload)\b/i,
  ]

  // Check if text matches functional patterns
  for (const pattern of actionPatterns) {
    if (pattern.test(lowerText)) {
      return true
    }
  }

  // Short text (< 4 words) is more likely to be functional
  const wordCount = text.split(/\s+/).length
  if (wordCount <= 3) {
    return true
  }

  return false
}

/**
 * Extract a functional description from aria-label.
 * Only use if it describes function, not just content.
 */
function extractFunctionalAriaLabel(element: Element): string | null {
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) {
    const cleaned = sanitizeText(ariaLabel)
    // Aria-labels that describe function typically contain action words
    // or are short descriptive phrases (not long content)
    if (cleaned.length <= 50 && isFunctionalDescription(cleaned)) {
      return cleaned
    }
  }

  // aria-labelledby references - only if functional
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labels = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent)
      .filter(Boolean)
      .join(' ')
    if (labels) {
      const cleaned = sanitizeText(labels)
      if (cleaned.length <= 50 && isFunctionalDescription(cleaned)) {
        return cleaned
      }
    }
  }

  return null
}

/**
 * Find associated label for form elements - returns functional label text.
 * Uses caching to avoid repeated DOM queries for the same element IDs.
 */
function findAssociatedLabel(element: Element): string | null {
  // Check for id and matching label[for]
  const id = element.getAttribute('id')
  if (id) {
    // Check cache first
    if (labelCache.has(id)) {
      return labelCache.get(id) ?? null
    }

    // Query DOM and cache result
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`)
    const labelText = label?.textContent ? sanitizeText(label.textContent) : null
    labelCache.set(id, labelText)
    if (labelText) return labelText
  }

  // Check for nested label (element inside label)
  // Use closest() which is optimized by browsers
  const parentLabel = element.closest('label')
  if (parentLabel) {
    // Get label text efficiently using firstChild iteration
    let labelText = ''
    const childNodes = parentLabel.childNodes
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i]
      if (!node || node === element) continue
      if (node.nodeType === Node.TEXT_NODE) {
        labelText += node.textContent || ''
      } else if (node.nodeType === Node.ELEMENT_NODE && node !== element) {
        labelText += (node as Element).textContent || ''
      }
    }
    labelText = labelText.trim()
    if (labelText) return sanitizeText(labelText)
  }

  return null
}

/**
 * Get functional name from element's name attribute or id.
 * Converts kebab-case/camelCase to readable text.
 */
function getFunctionalNameFromAttribute(element: Element): string | null {
  // Try name attribute first (common for form elements)
  const name = element.getAttribute('name')
  if (name && name.length <= 30) {
    return humanizeIdentifier(name)
  }

  // Try id attribute
  const id = element.getAttribute('id')
  if (id && id.length <= 30) {
    return humanizeIdentifier(id)
  }

  return null
}

// =============================================================================
// Functional Class Patterns
// =============================================================================

/**
 * Functional class patterns that indicate element purpose.
 * Maps class name patterns to human-readable descriptions.
 */
const FUNCTIONAL_CLASS_PATTERNS: Array<[RegExp, string]> = [
  // UI Components (most specific first)
  [/\bmodal\b/i, 'Modal'],
  [/\bdialog\b/i, 'Dialog'],
  [/\bdropdown[-_]?menu\b/i, 'Dropdown Menu'],
  [/\bdropdown\b/i, 'Dropdown'],
  [/\bpopover\b/i, 'Popover'],
  [/\btooltip\b/i, 'Tooltip'],
  [/\btoast\b/i, 'Notification'],
  [/\balert\b/i, 'Alert'],
  [/\bbanner\b/i, 'Banner'],
  [/\bnotification\b/i, 'Notification'],

  // Cards and panels
  [/\bcard\b/i, 'Card'],
  [/\bpanel\b/i, 'Panel'],
  [/\btile\b/i, 'Tile'],
  [/\bwidget\b/i, 'Widget'],

  // Navigation
  [/\bnavbar\b/i, 'Navigation Bar'],
  [/\bnav[-_]?bar\b/i, 'Navigation Bar'],
  [/\bsidebar\b/i, 'Sidebar'],
  [/\bside[-_]?bar\b/i, 'Sidebar'],
  [/\btoolbar\b/i, 'Toolbar'],
  [/\btool[-_]?bar\b/i, 'Toolbar'],
  [/\bmenu[-_]?bar\b/i, 'Menu Bar'],
  [/\bbreadcrumb/i, 'Breadcrumb'],
  [/\bpagination\b/i, 'Pagination'],
  [/\bstepper\b/i, 'Stepper'],
  [/\btabs\b/i, 'Tab Navigation'],
  [/\btab[-_]?list\b/i, 'Tab List'],
  [/\btab[-_]?panel\b/i, 'Tab Panel'],
  [/\bnav\b/i, 'Navigation'],
  [/\bmenu\b/i, 'Menu'],

  // Interactive elements
  [/\baccordion\b/i, 'Accordion'],
  [/\bcollapse\b/i, 'Collapsible'],
  [/\bcarousel\b/i, 'Carousel'],
  [/\bslider\b/i, 'Slider'],
  [/\btoggle\b/i, 'Toggle'],
  [/\bswitch\b/i, 'Switch'],
  [/\bbtn\b/i, 'Button'],
  [/\bbutton\b/i, 'Button'],

  // Form-related
  [/\bform[-_]?group\b/i, 'Form Group'],
  [/\bform[-_]?field\b/i, 'Form Field'],
  [/\binput[-_]?group\b/i, 'Input Group'],
  [/\bsearch[-_]?box\b/i, 'Search Box'],
  [/\bsearch\b/i, 'Search'],
  [/\bfilter\b/i, 'Filter'],

  // Data display
  [/\bchart\b/i, 'Chart'],
  [/\bgraph\b/i, 'Graph'],
  [/\bstat\b/i, 'Statistic'],
  [/\bmetric\b/i, 'Metric'],
  [/\bdata[-_]?table\b/i, 'Data Table'],
  [/\btable\b/i, 'Table'],

  // Loading states
  [/\bloading\b/i, 'Loading'],
  [/\bspinner\b/i, 'Spinner'],
  [/\bskeleton\b/i, 'Loading Placeholder'],
  [/\bplaceholder\b/i, 'Placeholder'],

  // Layout containers
  [/\bheader\b/i, 'Header'],
  [/\bfooter\b/i, 'Footer'],
  [/\bmain[-_]?content\b/i, 'Main Content'],
  [/\bcontent[-_]?area\b/i, 'Content Area'],
  [/\bcontent\b/i, 'Content'],
  [/\bwrapper\b/i, 'Wrapper'],
  [/\bsection\b/i, 'Section'],
  [/\bgrid\b/i, 'Grid'],
  [/\blist\b/i, 'List'],
  [/\brow\b/i, 'Row'],
  [/\bcolumn\b/i, 'Column'],
  [/\bcol\b/i, 'Column'],

  // Misc UI
  [/\bavatar\b/i, 'Avatar'],
  [/\bicon\b/i, 'Icon'],
  [/\bbadge\b/i, 'Badge'],
  [/\bchip\b/i, 'Chip'],
  [/\btag\b/i, 'Tag'],
  [/\blabel\b/i, 'Label'],
  [/\bimage\b/i, 'Image'],
  [/\bmedia\b/i, 'Media'],
  [/\bvideo\b/i, 'Video'],
  [/\baudio\b/i, 'Audio'],

  // Actions
  [/\baction[-_]?bar\b/i, 'Action Bar'],
  [/\baction[-_]?group\b/i, 'Action Group'],
  [/\bbutton[-_]?group\b/i, 'Button Group'],
  [/\bbtn[-_]?group\b/i, 'Button Group'],
]

/**
 * Data attributes that commonly describe component purpose.
 */
const FUNCTIONAL_DATA_ATTRIBUTES = [
  'data-testid',
  'data-test-id',
  'data-cy', // Cypress
  'data-component',
  'data-section',
  'data-region',
  'data-block',
  'data-widget',
  'data-module',
]

/**
 * Extract prefix from class name before the matched pattern.
 * e.g., "user-card" with pattern /card/ → "User"
 */
function extractClassPrefix(className: string, pattern: RegExp): string | null {
  const match = className.match(pattern)
  if (!match || match.index === 0) return null

  const prefix = className.substring(0, match.index).replace(/[-_]+$/, '')
  if (prefix.length === 0 || prefix.length > 20) return null

  return humanizeIdentifier(prefix)
}

/**
 * Convert a class name to human-readable text.
 * Handles BEM, kebab-case, camelCase conventions.
 */
function humanizeClassName(className: string): string | null {
  // Remove common prefixes/suffixes that don't add meaning
  let name = className
    .replace(/^(js-|is-|has-|el-|c-|u-|l-|o-|t-)/, '') // Common prefixes
    .replace(/(-wrapper|-container|-inner|-outer|-content|-box|-item)$/, '') // Common suffixes

  if (name.length === 0) return null

  // Convert to readable text
  return humanizeIdentifier(name)
}

/**
 * Extract functional name from meaningful CSS classes.
 * Filters out utility classes and matches against known patterns.
 */
function extractFromClasses(element: Element): string | null {
  const classes = Array.from(element.classList)
  if (classes.length === 0) return null

  // Filter out utility classes
  const meaningfulClasses = classes.filter((cls) => !isUtilityClass(cls))
  if (meaningfulClasses.length === 0) return null

  // Try to match against functional patterns
  for (const cls of meaningfulClasses) {
    for (const [pattern, name] of FUNCTIONAL_CLASS_PATTERNS) {
      if (pattern.test(cls)) {
        // Extract any prefix from the class name for more specificity
        // e.g., "user-card" → "User Card", "search-dropdown" → "Search Dropdown"
        const prefix = extractClassPrefix(cls, pattern)
        if (prefix) {
          return `${prefix} ${name}`
        }
        return name
      }
    }
  }

  // If no pattern matched, try to humanize the first meaningful class
  const firstClass = meaningfulClasses[0]
  if (firstClass) {
    const humanized = humanizeClassName(firstClass)
    if (humanized && humanized.length <= 30) {
      return humanized
    }
  }

  return null
}

/**
 * Extract functional name from data attributes.
 */
function extractFromDataAttributes(element: Element): string | null {
  for (const attr of FUNCTIONAL_DATA_ATTRIBUTES) {
    const value = element.getAttribute(attr)
    if (value && value.length <= 40) {
      return humanizeIdentifier(value)
    }
  }
  return null
}

// =============================================================================
// Text Content Extraction
// =============================================================================

// Tags that should not have their content extracted
const SKIP_CONTENT_TAGS = new Set(['script', 'style', 'noscript', 'template'])

// Tags that are interactive and should stop text collection
const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea'])

/**
 * Helper to collect text content from interactive elements.
 */
function collectFunctionalText(element: Element): string {
  const textParts: string[] = []
  const maxChars = 50
  let totalChars = 0

  const collectText = (node: Node, depth: number): boolean => {
    if (depth > 5 || totalChars >= maxChars) return false

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        textParts.push(text)
        totalChars += text.length
        if (totalChars >= maxChars) return false
      }
      return true
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const elTag = el.tagName.toLowerCase()
      if (SKIP_CONTENT_TAGS.has(elTag)) return true
      if (depth > 0 && INTERACTIVE_TAGS.has(elTag)) return true

      const children = el.childNodes
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child && !collectText(child, depth + 1)) return false
      }
    }
    return true
  }

  collectText(element, 0)
  return textParts.join(' ').trim()
}

/**
 * Extract FUNCTIONAL text content from an element.
 * Only returns text if it describes action/function, not content/value.
 */
function extractFunctionalTextContent(element: Element): string | null {
  const tagName = element.tagName.toLowerCase()

  // For inputs, never use the value - it's user data
  if (tagName === 'input' || tagName === 'textarea') {
    return null
  }

  // For select elements, don't use selected option - it's data
  if (tagName === 'select') {
    return null
  }

  // For buttons and links, extract text only if it's functional
  if (tagName === 'button' || tagName === 'a') {
    const fullText = collectFunctionalText(element)
    if (fullText && isFunctionalDescription(fullText)) {
      return sanitizeText(fullText)
    }
  }

  return null
}

/**
 * Get a functional purpose from title attribute.
 * Title often describes what an element does.
 */
function extractFunctionalTitle(element: Element): string | null {
  const title = element.getAttribute('title')
  if (title) {
    const cleaned = sanitizeText(title)
    // Only use title if it's functional (describes action/purpose)
    if (cleaned.length <= 60 && isFunctionalDescription(cleaned)) {
      return cleaned
    }
  }
  return null
}

/**
 * Get alt text for images and media.
 */
function extractAltText(element: Element): string | null {
  const alt = element.getAttribute('alt')
  if (alt) return sanitizeText(alt)

  return null
}

// =============================================================================
// Contextual Name Generation
// =============================================================================

/**
 * Get contextual prefix from parent containers.
 * Adds context like "Navigation:", "Form:", "Table:" etc.
 */
function getContextualPrefix(element: Element): string | null {
  // Limit traversal to avoid performance issues
  const maxDepth = 3
  let current = element.parentElement
  let depth = 0

  while (current && depth < maxDepth) {
    const tagName = current.tagName.toLowerCase()

    // Navigation context
    if (tagName === 'nav') {
      const navLabel = current.getAttribute('aria-label')
      return navLabel ? `${truncateText(sanitizeText(navLabel), 20)} Navigation` : 'Navigation'
    }

    // Form context with name
    if (tagName === 'form') {
      const formName = current.getAttribute('name') || current.getAttribute('aria-label')
      return formName ? `${truncateText(formName, 20)} Form` : 'Form'
    }

    // Fieldset context
    if (tagName === 'fieldset') {
      const legend = current.querySelector('legend')
      if (legend?.textContent) {
        return truncateText(sanitizeText(legend.textContent), 30)
      }
    }

    // Table context
    if (tagName === 'table') {
      const caption = current.querySelector('caption')
      if (caption?.textContent) {
        return `${truncateText(sanitizeText(caption.textContent), 20)} Table`
      }
      return 'Table'
    }

    // Section/article with heading
    if (tagName === 'section' || tagName === 'article') {
      const heading = current.querySelector('h1, h2, h3, h4, h5, h6')
      if (heading?.textContent) {
        return truncateText(sanitizeText(heading.textContent), 25)
      }
    }

    // Dialog context
    if (tagName === 'dialog' || current.getAttribute('role') === 'dialog') {
      const dialogTitle = current.querySelector('[role="heading"], h1, h2, h3')
      if (dialogTitle?.textContent) {
        return `${truncateText(sanitizeText(dialogTitle.textContent), 20)} Dialog`
      }
      return 'Dialog'
    }

    current = current.parentElement
    depth++
  }

  return null
}

/**
 * Get table cell context (row/column headers).
 */
function getTableCellContext(element: Element): string | null {
  const tagName = element.tagName.toLowerCase()
  if (tagName !== 'td' && tagName !== 'th') return null

  const row = element.closest('tr')
  if (!row) return null

  const table = element.closest('table')
  if (!table) return null

  const cellIndex = Array.from(row.children).indexOf(element)

  const parts: string[] = []

  // Get column header
  const headerRow = table.querySelector('thead tr') || table.querySelector('tr')
  if (headerRow && headerRow !== row) {
    const columnHeader = headerRow.children[cellIndex]
    if (columnHeader?.textContent) {
      parts.push(truncateText(sanitizeText(columnHeader.textContent), 20))
    }
  }

  // Get row header (first th in the row)
  const rowHeader = row.querySelector('th')
  if (rowHeader && rowHeader !== element) {
    parts.push(truncateText(sanitizeText(rowHeader.textContent || ''), 20))
  }

  return parts.length > 0 ? `Table Cell: ${parts.join(' / ')}` : null
}

/**
 * Get list item context.
 */
function getListItemContext(element: Element): string | null {
  if (element.tagName.toLowerCase() !== 'li') return null

  const list = element.closest('ul, ol')
  if (!list) return null

  const items = Array.from(list.querySelectorAll(':scope > li'))
  const index = items.indexOf(element as HTMLLIElement) + 1

  // Check if it's a navigation list
  const isNav = list.closest('nav') !== null
  const listAriaLabel = list.getAttribute('aria-label')

  if (listAriaLabel) {
    return `${truncateText(listAriaLabel, 20)} Item ${index}`
  }
  if (isNav) {
    return `Navigation Item ${index}`
  }

  return null
}

/**
 * Infer purpose from child content.
 * Looks at what's inside an element to understand its function.
 */
function inferFromChildContent(element: Element): string | null {
  // If contains a direct heading, use that to describe the section
  const heading = element.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4')
  if (heading?.textContent) {
    const headingText = sanitizeText(heading.textContent)
    if (headingText.length <= 30) {
      return `${headingText} Section`
    }
  }

  // If contains a direct form, it's a form container
  if (element.querySelector(':scope > form')) {
    const formName = element.querySelector(':scope > form')?.getAttribute('name')
    if (formName) {
      return `${humanizeIdentifier(formName)} Form Container`
    }
    return 'Form Container'
  }

  // If contains a direct table, it's a data display
  if (element.querySelector(':scope > table')) {
    const caption = element.querySelector(':scope > table > caption')
    if (caption?.textContent) {
      return `${truncateText(sanitizeText(caption.textContent), 20)} Table Container`
    }
    return 'Table Container'
  }

  // If contains a direct list with aria-label
  const list = element.querySelector(':scope > ul, :scope > ol')
  if (list) {
    const listLabel = list.getAttribute('aria-label')
    if (listLabel) {
      return `${truncateText(sanitizeText(listLabel), 20)} List Container`
    }
  }

  // If contains media elements
  if (element.querySelector(':scope > img, :scope > picture')) {
    const img = element.querySelector(':scope > img')
    const alt = img?.getAttribute('alt')
    if (alt && alt.length <= 25) {
      return `${sanitizeText(alt)} Image Container`
    }
    return 'Image Container'
  }

  if (element.querySelector(':scope > video')) {
    return 'Video Container'
  }

  // If contains multiple buttons, it's an action group
  const buttons = element.querySelectorAll(
    ':scope > button, :scope > [role="button"], :scope > a.btn, :scope > a.button'
  )
  if (buttons.length >= 2) {
    return 'Action Group'
  }

  // If contains multiple links, it's a link group
  const links = element.querySelectorAll(':scope > a')
  if (links.length >= 3) {
    return 'Link Group'
  }

  return null
}

/**
 * Infer purpose from sibling context.
 * If element is part of a repeated pattern, describe its position.
 */
function inferFromSiblings(element: Element): string | null {
  const parent = element.parentElement
  if (!parent) return null

  // Get siblings with same tag
  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName === element.tagName
  )

  // Only useful if there are multiple similar siblings
  if (siblings.length < 3) return null

  const index = siblings.indexOf(element) + 1

  // Try to get a meaningful name from parent context
  const parentClasses = parent.className.toLowerCase()

  // Check parent for context clues
  for (const [pattern, name] of FUNCTIONAL_CLASS_PATTERNS) {
    if (pattern.test(parentClasses)) {
      // Singularize common plural patterns
      const singular = name.replace(/s$/, '').replace(/List$/, 'Item')
      return `${singular} ${index}`
    }
  }

  // Check parent's aria-label
  const parentLabel = parent.getAttribute('aria-label')
  if (parentLabel && parentLabel.length <= 20) {
    return `${sanitizeText(parentLabel)} Item ${index}`
  }

  // Generic list item
  return `Item ${index}`
}

/**
 * Get position-based name from page structure.
 */
function getPositionalName(element: Element): string | null {
  // Check if in header
  const header = document.querySelector('header, [role="banner"]')
  if (header?.contains(element) && header !== element) {
    return 'Header Element'
  }

  // Check if in footer
  const footer = document.querySelector('footer, [role="contentinfo"]')
  if (footer?.contains(element) && footer !== element) {
    return 'Footer Element'
  }

  // Check if in main content
  const main = document.querySelector('main, [role="main"]')
  if (main?.contains(element) && main !== element) {
    return 'Content Element'
  }

  // Check if in sidebar/aside
  const aside = document.querySelector('aside, [role="complementary"]')
  if (aside?.contains(element) && aside !== element) {
    return 'Sidebar Element'
  }

  // Check if in nav
  const nav = document.querySelector('nav, [role="navigation"]')
  if (nav?.contains(element) && nav !== element) {
    return 'Navigation Element'
  }

  return null
}

/**
 * Enhanced parent context search with class pattern matching.
 * Searches deeper and matches against functional class patterns.
 */
function getEnhancedParentContext(element: Element): string | null {
  const maxDepth = 5
  let current = element.parentElement
  let depth = 0

  while (current && depth < maxDepth) {
    // Check classes on parent
    for (const [pattern, name] of FUNCTIONAL_CLASS_PATTERNS) {
      if (pattern.test(current.className)) {
        return `${name} Element`
      }
    }

    // Check data attributes on parent
    for (const attr of FUNCTIONAL_DATA_ATTRIBUTES) {
      const value = current.getAttribute(attr)
      if (value && value.length <= 30) {
        return `${humanizeIdentifier(value)} Element`
      }
    }

    // Check aria-label on parent
    const ariaLabel = current.getAttribute('aria-label')
    if (ariaLabel && ariaLabel.length <= 25) {
      return `${sanitizeText(ariaLabel)} Element`
    }

    current = current.parentElement
    depth++
  }

  return null
}

// Fallback tag name mappings for semantic elements
const PRETTY_TAG_NAMES: Record<string, string> = {
  div: 'Container',
  span: 'Text Element',
  p: 'Paragraph',
  section: 'Section',
  article: 'Article',
  aside: 'Sidebar',
  header: 'Header',
  footer: 'Footer',
  main: 'Main Content',
  nav: 'Navigation',
  form: 'Form',
  fieldset: 'Field Group',
  figure: 'Figure',
  figcaption: 'Caption',
  details: 'Expandable Section',
  summary: 'Summary',
  dialog: 'Dialog',
  menu: 'Menu',
  ul: 'List',
  ol: 'Numbered List',
  dl: 'Definition List',
  table: 'Table',
  thead: 'Table Header',
  tbody: 'Table Body',
  tfoot: 'Table Footer',
  tr: 'Table Row',
  th: 'Column Header',
  td: 'Table Cell',
  canvas: 'Canvas',
  video: 'Video Player',
  audio: 'Audio Player',
  iframe: 'Embedded Frame',
  embed: 'Embedded Content',
  object: 'Embedded Object',
  picture: 'Picture',
  source: 'Media Source',
  track: 'Media Track',
  map: 'Image Map',
  area: 'Image Map Area',
  svg: 'Vector Graphic',
  math: 'Mathematical Expression',
  blockquote: 'Block Quote',
  pre: 'Preformatted Text',
  code: 'Code Block',
  kbd: 'Keyboard Input',
  samp: 'Sample Output',
  var: 'Variable',
  time: 'Time Element',
  mark: 'Highlighted Text',
  meter: 'Meter',
  progress: 'Progress Bar',
  output: 'Output',
}

// =============================================================================
// Main Friendly Name Generator
// =============================================================================

/**
 * Generate a human-friendly name for an element.
 *
 * Names describe WHAT the element DOES, not what value it contains.
 *
 * Priority Order:
 * 1. Input type description (Email Field, Password Field)
 * 2. Functional aria-label (explicitly defined purpose)
 * 3. Associated form label (Username Text Field)
 * 4. Name/ID attribute (humanized: User Email)
 * 5. Meaningful CSS classes (Card, Modal, Dropdown Menu)
 * 6. Data attributes (User Profile Card from data-testid)
 * 7. Functional text content (Submit Button)
 * 8. Child content analysis (Form Container)
 * 9. Sibling context (Card 3)
 * 10. Enhanced parent context (Sidebar Element)
 * 11. Position-based (Header Element)
 * 12. Table/list context (Revenue Cell)
 * 13. Type suffix (Button)
 * 14. Prettified tag (Container - last resort)
 */
export function generateFriendlyName(element: Element): string {
  const startTime = performance.now()
  performanceMetrics.totalCalls++

  // Check cache first
  const cached = nameCache.get(element)
  if (cached) {
    performanceMetrics.cacheHits++
    return cached
  }

  const tagName = element.tagName.toLowerCase()
  let functionalName: string | null = null
  let typeDescription: string | null = null

  // Step 1: Get the type/function description for the element
  typeDescription = getInputTypeDescription(element) || getTypeSuffix(element)

  // Step 2: Try to get a functional qualifier (what makes this element unique)
  // Priority order designed to maximize specificity and minimize generic names

  // Priority 1: Functional aria-label (describes purpose, not content)
  functionalName = extractFunctionalAriaLabel(element)

  // Priority 2: Associated form label (labels describe field purpose)
  if (!functionalName) {
    functionalName = findAssociatedLabel(element)
  }

  // Priority 3: Functional name/id attribute (often describes purpose)
  if (!functionalName) {
    functionalName = getFunctionalNameFromAttribute(element)
  }

  // Priority 4: Meaningful CSS classes (Card, Modal, Dropdown, etc.)
  if (!functionalName) {
    functionalName = extractFromClasses(element)
  }

  // Priority 5: Data attributes (data-testid, data-component, etc.)
  if (!functionalName) {
    functionalName = extractFromDataAttributes(element)
  }

  // Priority 6: Functional text content (action words in buttons/links)
  if (!functionalName) {
    functionalName = extractFunctionalTextContent(element)
  }

  // Priority 7: Functional title attribute
  if (!functionalName) {
    functionalName = extractFunctionalTitle(element)
  }

  // Priority 8: Alt text for images (describes image purpose)
  if (!functionalName && (tagName === 'img' || tagName === 'svg')) {
    functionalName = extractAltText(element)
  }

  // Priority 9: Child content analysis (Form Container, Table Container, etc.)
  if (!functionalName) {
    functionalName = inferFromChildContent(element)
  }

  // Priority 10: Sibling context (Card 3, Item 2, etc.)
  if (!functionalName) {
    functionalName = inferFromSiblings(element)
  }

  // Priority 11: Enhanced parent context (deeper search with class patterns)
  if (!functionalName) {
    functionalName = getEnhancedParentContext(element)
  }

  // Priority 12: Position-based naming (Header Element, Sidebar Element, etc.)
  if (!functionalName) {
    functionalName = getPositionalName(element)
  }

  // Priority 13: Contextual prefix from parent (Navigation, Form, etc.)
  if (!functionalName) {
    functionalName = getContextualPrefix(element)
  }

  // Priority 14: Table/list context
  if (!functionalName) {
    functionalName = getTableCellContext(element) || getListItemContext(element)
  }

  // Build the final functional name
  let friendlyName: string

  if (functionalName && typeDescription) {
    // Combine: "Email" + "Field" → "Email Field"
    // But avoid redundancy: "Submit Button" + "Button" → "Submit Button"
    const lowerFunctional = functionalName.toLowerCase()
    const lowerType = typeDescription.toLowerCase()
    const firstWord = lowerFunctional.split(' ')[0] || ''

    if (lowerFunctional.includes(lowerType) || lowerType.includes(firstWord)) {
      // Avoid redundancy
      friendlyName = truncateText(functionalName)
    } else {
      friendlyName = `${truncateText(functionalName)} ${typeDescription}`
    }
  } else if (functionalName) {
    friendlyName = truncateText(functionalName)
  } else if (typeDescription) {
    friendlyName = typeDescription
  } else {
    // Absolute fallback: prettified tag name
    friendlyName = PRETTY_TAG_NAMES[tagName] || tagName.charAt(0).toUpperCase() + tagName.slice(1)
  }

  // Cache the result
  nameCache.set(element, friendlyName)

  // Update performance metrics
  const elapsed = performance.now() - startTime
  performanceMetrics.totalTime += elapsed
  if (elapsed > performanceMetrics.maxTime) {
    performanceMetrics.maxTime = elapsed
  }
  const nonCacheCalls = performanceMetrics.totalCalls - performanceMetrics.cacheHits
  performanceMetrics.avgTime = nonCacheCalls > 0 ? performanceMetrics.totalTime / nonCacheCalls : 0

  return friendlyName
}

// =============================================================================
// Element Label (for display in highlight overlay)
// =============================================================================

/**
 * Get a display label for an element (used in highlight overlay)
 */
export function getElementLabel(element: Element): string {
  const tagName = element.tagName.toLowerCase()

  if (element.id) {
    return `${tagName}#${element.id}`
  }

  const meaningfulClasses = Array.from(element.classList)
    .filter((cls) => !isUtilityClass(cls))
    .slice(0, 2)

  if (meaningfulClasses.length > 0) {
    return `${tagName}.${meaningfulClasses.join('.')}`
  }

  return tagName
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
export function shouldExcludeElement(
  element: Element,
  excludeAttribute: string = 'data-element-picker'
): boolean {
  const tagName = element.tagName.toLowerCase()

  // Exclude html and body
  if (tagName === 'html' || tagName === 'body') {
    return true
  }

  // Exclude elements with the specified data attribute
  if (element.hasAttribute(excludeAttribute)) {
    return true
  }

  // Also check for feedback-picker attribute for backwards compatibility
  if (element.hasAttribute('data-feedback-picker')) {
    return true
  }

  // Check parent chain for picker overlay
  let current: Element | null = element
  while (current) {
    if (
      current.hasAttribute('data-feedback-picker-overlay') ||
      current.hasAttribute(`${excludeAttribute}-overlay`) ||
      current.hasAttribute(excludeAttribute)
    ) {
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

// =============================================================================
// Backward Compatibility Aliases
// =============================================================================

/**
 * @deprecated Use `isTailwindClass` from filterTailwindClasses instead
 */
export function isTailwindClass(className: string): boolean {
  return isUtilityClass(className)
}
