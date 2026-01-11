import prompts from 'prompts'
import pc from 'picocolors'
import {
  generatePackageFiles,
  printGeneratedFiles,
  printPrismaSchema,
  GeneratorOptions,
} from '../generators'
import { detectRouter } from '../utils/files'

const VALID_PACKAGES = [
  'devtools',
  'feedback',
  'whats-new',
  'theme',
  'audit',
]

export async function addCommand(packageName: string) {
  console.log(pc.bold(`\nAdding @nextstack/${packageName}\n`))

  if (!VALID_PACKAGES.includes(packageName)) {
    console.log(pc.red(`Unknown package: ${packageName}`))
    console.log(pc.dim(`Valid packages: ${VALID_PACKAGES.join(', ')}`))
    process.exit(1)
  }

  // Detect project root
  const projectRoot = process.cwd()
  const router = detectRouter(projectRoot)

  if (router === null) {
    console.log(pc.yellow('⚠ Could not detect Next.js App Router structure.'))
    console.log(pc.dim('Make sure you are in a Next.js project root with an app/ directory.\n'))
  } else if (router === 'pages') {
    console.log(pc.yellow('⚠ Pages Router detected. @nextstack packages require App Router.\n'))
  } else {
    console.log(pc.dim(`Detected: App Router\n`))
  }

  // For packages that need auth provider configuration
  let authProvider = 'supabase'
  if (['feedback', 'whats-new', 'audit'].includes(packageName)) {
    const response = await prompts({
      type: 'select',
      name: 'authProvider',
      message: 'Which auth provider are you using?',
      choices: [
        { title: 'Supabase', value: 'supabase' },
        { title: 'Clerk', value: 'clerk' },
        { title: 'NextAuth', value: 'next-auth' },
      ],
    })
    if (!response.authProvider) {
      console.log(pc.yellow('No auth provider selected. Exiting.'))
      return
    }
    authProvider = response.authProvider
  }

  const options: GeneratorOptions = {
    projectRoot,
    authProvider,
  }

  console.log(pc.bold('\nGenerating files...\n'))

  // Generate files for the package
  const files = generatePackageFiles(packageName, options)

  if (files.length === 0) {
    console.log(pc.yellow(`No API routes to generate for @nextstack/${packageName}`))
    console.log(pc.dim('This package may only require component imports.\n'))
  } else {
    printGeneratedFiles(files)
    printPrismaSchema(packageName)
    console.log(pc.green(`\n✓ Generated ${files.length} files!\n`))
  }

  // Print dependency to add
  console.log(pc.cyan('Add this dependency to your package.json:'))
  console.log(pc.dim(`  "@nextstack/${packageName}": "github:nextstack-dev/next-components#main"`))

  console.log(pc.cyan('\nNext steps:'))
  console.log('1. Run pnpm install')
  if (['feedback', 'whats-new', 'audit'].includes(packageName)) {
    console.log('2. Add the Prisma schema additions shown above')
    console.log('3. Run npx prisma generate && npx prisma db push')
    console.log('4. Import and use the components in your app')
  } else {
    console.log('2. Import and use the components in your app')
  }
}
