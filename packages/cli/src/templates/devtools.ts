export const devInfoApiRoute = `import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  try {
    let gitBranch = 'unknown'
    try {
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim()
    } catch {
      // Git not available or not a repo
    }

    const dbHost = process.env.DATABASE_URL?.includes('localhost')
      ? 'local'
      : 'remote'

    return NextResponse.json({
      gitBranch,
      database: dbHost,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get dev info' },
      { status: 500 }
    )
  }
}
`

export const devLoginPage = `'use client'

import { DevLoginPage } from '@nextstack/devtools'

// Configure your test users here
const testUsers = [
  {
    id: 'admin',
    email: 'admin@test.local',
    password: 'test123',
    name: 'Admin User',
    role: 'admin',
    category: 'Admins',
    description: 'Full access',
  },
  {
    id: 'user',
    email: 'user@test.local',
    password: 'test123',
    name: 'Test User',
    role: 'user',
    category: 'Users',
    description: 'Regular access',
  },
]

export default function Page() {
  return (
    <DevLoginPage
      users={testUsers}
      redirectTo="/dashboard"
      showCustomLogin={true}
    />
  )
}
`
