export const whatsNewApiRoute = `import { NextResponse } from 'next/server'
import { createWhatsNewService } from '@nextdevx/whats-new'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createWhatsNewService(prisma, auth)

export async function GET() {
  try {
    const entries = await service.getEntries()
    return NextResponse.json({ entries })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get entries' },
      { status: 500 }
    )
  }
}
`

export const whatsNewVoteRoute = `import { NextRequest, NextResponse } from 'next/server'
import { createWhatsNewService } from '@nextdevx/whats-new'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createWhatsNewService(prisma, auth)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { voteType } = await req.json()
    const result = await service.vote(id, voteType)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vote' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
`
