/**
 * Sensitive field patterns that should be redacted from audit logs
 */
const SENSITIVE_PATTERNS = [
  'password',
  'passwordhash',
  'apikey',
  'apitoken',
  'accesstoken',
  'refreshtoken',
  'secret',
  'privatekey',
  'encryptedapitoken',
  'encryptioniv',
  'directsignupnonce',
  'token',
  'credential',
  'auth',
]

/**
 * Check if a key matches a sensitive pattern
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return SENSITIVE_PATTERNS.some(
    (pattern) => lowerKey.includes(pattern) || lowerKey === pattern
  )
}

/**
 * Recursively sanitize an object, redacting sensitive fields
 *
 * @example
 * ```ts
 * sanitizeChanges({ password: 'secret', name: 'John' })
 * // Returns: { password: '[REDACTED]', name: 'John' }
 * ```
 */
export function sanitizeChanges<T extends Record<string, unknown>>(
  obj: T | null | undefined
): T | null {
  if (obj === null || obj === undefined) return null

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]'
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeChanges(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeChanges(item as Record<string, unknown>)
          : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}
