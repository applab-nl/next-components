import * as path from 'path'
import pc from 'picocolors'
import { writeFile, ensureDir, getApiPath, getLibPath } from '../utils/files'
import {
  feedbackApiRoute,
  feedbackVoteRoute,
  suggestionsRoute,
} from '../templates/feedback'
import {
  whatsNewApiRoute,
  whatsNewVoteRoute,
} from '../templates/whats-new'
import { auditApiRoute } from '../templates/audit'
import { devInfoApiRoute, devLoginPage } from '../templates/devtools'
import { nextstackProviderSetup, prismaSchemaAdditions } from '../templates/config'

export interface GeneratorOptions {
  projectRoot: string
  authProvider: string
}

export function generateFeedbackFiles(options: GeneratorOptions): string[] {
  const apiPath = getApiPath(options.projectRoot)
  const files: string[] = []

  // API routes
  const feedbackDir = path.join(apiPath, 'feedback')
  ensureDir(feedbackDir)

  writeFile(path.join(feedbackDir, 'route.ts'), feedbackApiRoute)
  files.push('app/api/feedback/route.ts')

  writeFile(path.join(feedbackDir, '[id]', 'vote', 'route.ts'), feedbackVoteRoute)
  files.push('app/api/feedback/[id]/vote/route.ts')

  writeFile(path.join(apiPath, 'suggestions', 'route.ts'), suggestionsRoute)
  files.push('app/api/suggestions/route.ts')

  return files
}

export function generateWhatsNewFiles(options: GeneratorOptions): string[] {
  const apiPath = getApiPath(options.projectRoot)
  const files: string[] = []

  const whatsNewDir = path.join(apiPath, 'whats-new')
  ensureDir(whatsNewDir)

  writeFile(path.join(whatsNewDir, 'route.ts'), whatsNewApiRoute)
  files.push('app/api/whats-new/route.ts')

  writeFile(path.join(whatsNewDir, '[id]', 'vote', 'route.ts'), whatsNewVoteRoute)
  files.push('app/api/whats-new/[id]/vote/route.ts')

  return files
}

export function generateAuditFiles(options: GeneratorOptions): string[] {
  const apiPath = getApiPath(options.projectRoot)
  const files: string[] = []

  const auditDir = path.join(apiPath, 'admin', 'audit')
  ensureDir(auditDir)

  writeFile(path.join(auditDir, 'route.ts'), auditApiRoute)
  files.push('app/api/admin/audit/route.ts')

  return files
}

export function generateDevtoolsFiles(options: GeneratorOptions): string[] {
  const apiPath = getApiPath(options.projectRoot)
  const files: string[] = []

  // Dev info API route
  const devDir = path.join(apiPath, 'dev', 'info')
  ensureDir(devDir)

  writeFile(path.join(devDir, 'route.ts'), devInfoApiRoute)
  files.push('app/api/dev/info/route.ts')

  // Dev login page
  const appPath = path.dirname(apiPath)
  const devLoginDir = path.join(appPath, 'dev-login')
  ensureDir(devLoginDir)

  writeFile(path.join(devLoginDir, 'page.tsx'), devLoginPage)
  files.push('app/dev-login/page.tsx')

  return files
}

export function generateProviderFile(options: GeneratorOptions): string[] {
  const libPath = getLibPath(options.projectRoot)
  const files: string[] = []

  writeFile(
    path.join(libPath, 'nextstack-provider.tsx'),
    nextstackProviderSetup(options.authProvider)
  )
  files.push('lib/nextstack-provider.tsx')

  return files
}

export function generatePackageFiles(
  packageName: string,
  options: GeneratorOptions
): string[] {
  switch (packageName) {
    case 'feedback':
      return generateFeedbackFiles(options)
    case 'whats-new':
      return generateWhatsNewFiles(options)
    case 'audit':
      return generateAuditFiles(options)
    case 'devtools':
      return generateDevtoolsFiles(options)
    default:
      return []
  }
}

export function getPrismaSchemaAddition(packageName: string): string | null {
  return prismaSchemaAdditions[packageName] ?? null
}

export function printGeneratedFiles(files: string[]): void {
  if (files.length === 0) return

  console.log(pc.green('\nGenerated files:'))
  files.forEach((file) => {
    console.log(pc.dim(`  ${file}`))
  })
}

export function printPrismaSchema(packageName: string): void {
  const schema = getPrismaSchemaAddition(packageName)
  if (schema) {
    console.log(pc.yellow('\nPrisma schema additions:'))
    console.log(pc.dim('Add these models to your prisma/schema.prisma:'))
    console.log(pc.dim(schema))
  }
}
