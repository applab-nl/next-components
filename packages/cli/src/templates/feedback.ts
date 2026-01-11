export const feedbackApiRoute = `import { NextRequest, NextResponse } from 'next/server'
import { createFeedbackService } from '@nextstack/feedback'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createFeedbackService(prisma, auth)

export async function GET() {
  try {
    const feedback = await service.getMyFeedback()
    return NextResponse.json(feedback)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get feedback' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const feedback = await service.submitFeedback(body)
    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
`

export const feedbackVoteRoute = `import { NextRequest, NextResponse } from 'next/server'
import { createFeedbackService } from '@nextstack/feedback'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createFeedbackService(prisma, auth)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { voteType } = await req.json()
    const newScore = await service.vote(id, voteType)
    return NextResponse.json({ voteScore: newScore })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vote' },
      { status: 500 }
    )
  }
}
`

export const suggestionsRoute = `import { NextRequest, NextResponse } from 'next/server'
import { createFeedbackService } from '@nextstack/feedback'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createFeedbackService(prisma, auth)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const sortBy = (searchParams.get('sortBy') ?? 'votes') as 'votes' | 'newest'

    const result = await service.getSuggestions({ page, limit, sortBy })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}
`
