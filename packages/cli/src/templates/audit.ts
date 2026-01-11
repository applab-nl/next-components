export const auditApiRoute = `import { NextRequest, NextResponse } from 'next/server'
import { createAuditService } from '@nextstack/audit'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const service = createAuditService(prisma, auth)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const params = {
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '50'),
      entityType: searchParams.get('entityType') ?? undefined,
      action: (searchParams.get('action') ?? undefined) as any,
      userId: searchParams.get('userId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    }

    const result = await service.getAuditLogs(params)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get audit logs' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
`
