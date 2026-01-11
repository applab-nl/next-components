/**
 * Check if running on localhost
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') {
    // Server-side check
    return process.env.NODE_ENV === 'development'
  }

  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  )
}

/**
 * Check if in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Get current environment name
 */
export function getEnvironmentName(): 'development' | 'staging' | 'production' {
  if (process.env.NODE_ENV === 'production') {
    // Check for staging indicators
    const host =
      typeof window !== 'undefined' ? window.location.hostname : ''
    if (
      host.includes('staging') ||
      host.includes('preview') ||
      process.env.VERCEL_ENV === 'preview'
    ) {
      return 'staging'
    }
    return 'production'
  }
  return 'development'
}
