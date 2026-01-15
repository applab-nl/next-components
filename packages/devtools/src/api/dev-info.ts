import { execFileSync } from 'child_process'
import { NextResponse } from 'next/server'

export interface DevInfoHandlerOptions {
  /** Allow in production (default: false) */
  allowInProduction?: boolean
  /** Include git branch info (default: true) */
  includeGitBranch?: boolean
  /** Include database info (default: false) */
  includeDbInfo?: boolean
  /** Custom database identifier */
  databaseId?: string
  /** Custom info to include */
  customInfo?: () => Promise<Record<string, unknown>>
}

export interface DevInfoResponse {
  branch?: string
  database?: string
  [key: string]: unknown
}

/**
 * Create API route handler for dev info endpoint
 *
 * @example
 * ```ts
 * // app/api/dev/info/route.ts
 * import { createDevInfoHandler } from '@nextdevx/devtools/api'
 *
 * export const GET = createDevInfoHandler({
 *   includeGitBranch: true,
 *   databaseId: process.env.DATABASE_URL?.includes('localhost') ? 'Local' : 'Remote'
 * })
 * ```
 */
export function createDevInfoHandler(options: DevInfoHandlerOptions = {}) {
  const {
    allowInProduction = false,
    includeGitBranch = true,
    includeDbInfo = false,
    databaseId,
    customInfo,
  } = options

  return async function GET(): Promise<NextResponse<DevInfoResponse>> {
    // Block in production unless explicitly allowed
    if (process.env.NODE_ENV === 'production' && !allowInProduction) {
      return NextResponse.json(
        { error: 'Not available in production' } as unknown as DevInfoResponse,
        { status: 403 }
      )
    }

    const response: DevInfoResponse = {}

    // Get git branch
    if (includeGitBranch) {
      try {
        const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
          timeout: 5000,
          encoding: 'utf-8',
        }).trim()
        response.branch = branch
      } catch {
        response.branch = 'unknown'
      }
    }

    // Add database info
    if (includeDbInfo || databaseId) {
      response.database = databaseId ?? 'unknown'
    }

    // Add custom info
    if (customInfo) {
      try {
        const custom = await customInfo()
        Object.assign(response, custom)
      } catch {
        // Ignore custom info errors
      }
    }

    return NextResponse.json(response)
  }
}
