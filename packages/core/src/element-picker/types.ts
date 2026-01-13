/**
 * Element information captured by the element picker
 */
export interface ElementInfo {
  /** Human-readable element name */
  friendlyName: string
  /** CSS selector for the element */
  cssSelector: string
  /** XPath to the element */
  xpath: string
  /** HTML tag name (lowercase) */
  tagName: string
}

/**
 * Position for highlight overlay
 */
export interface HighlightPosition {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Position for tooltip
 */
export interface TooltipPosition {
  top: number
  left: number
}

/**
 * Props for ElementPicker component
 */
export interface ElementPickerProps {
  /** Whether the picker is active */
  isOpen: boolean
  /** Callback when an element is selected */
  onSelect: (elementInfo: ElementInfo) => void
  /** Callback when selection is cancelled */
  onCancel: () => void
  /** Custom instruction text (optional) */
  instructionText?: string
  /** Data attribute to use for excluding picker elements (default: 'data-element-picker') */
  excludeAttribute?: string
}
