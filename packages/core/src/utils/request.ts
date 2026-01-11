/**
 * Extract IP address from request headers
 * Supports reverse proxies (x-forwarded-for, x-real-ip, cf-connecting-ip)
 */
export function getIpAddress(headers: Headers): string | null {
  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // Standard proxy headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp

  return null
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(headers: Headers): string | null {
  return headers.get('user-agent')
}

/**
 * Extract request metadata for audit logging
 */
export function getRequestMetadata(headers: Headers): {
  ipAddress: string | null
  userAgent: string | null
} {
  return {
    ipAddress: getIpAddress(headers),
    userAgent: getUserAgent(headers),
  }
}
