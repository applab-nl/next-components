// @nextstack/core/element-picker - Shared element picker utilities

// Components
export { ElementPicker } from './ElementPicker'

// Types
export type {
  ElementInfo,
  ElementPickerProps,
  HighlightPosition,
  TooltipPosition,
} from './types'

// Utilities
export {
  // Element info generation
  getElementInfo,
  generateFriendlyName,
  generateCssSelector,
  generateXPath,
  getElementLabel,

  // Element lookup
  findElementBySelector,

  // Element picker helpers
  shouldExcludeElement,
  getElementBounds,

  // Class utilities
  filterTailwindClasses,
  isTailwindClass,

  // Cache management
  clearNameCaches,
  getNameGenerationMetrics,
  resetNameGenerationMetrics,
} from './element-picker-utils'
