/**
 * Element Picker Utilities - Re-exported from @nextdevx/core/element-picker
 *
 * This module has been moved to core for sharing between packages.
 * This file re-exports for backwards compatibility.
 */

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
} from '@nextdevx/core/element-picker'

export type { ElementInfo } from '@nextdevx/core/element-picker'
