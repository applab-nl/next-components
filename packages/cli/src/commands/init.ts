import prompts from 'prompts'
import pc from 'picocolors'
import {
  generatePackageFiles,
  generateProviderFile,
  printGeneratedFiles,
  printPrismaSchema,
  GeneratorOptions,
} from '../generators'
import { detectRouter } from '../utils/files'

const PACKAGES = [
  { name: 'devtools', description: 'Dev mode indicator, dev-login page' },
  { name: 'feedback', description: 'Feedback system with element picker' },
  { name: 'whats-new', description: 'Changelog with voting' },
  { name: 'theme', description: 'Theme provider (light/dark/system)' },
  { name: 'audit', description: 'Audit logging system' },
]

export async function initCommand() {
  console.log(pc.bold('\n@nextdevx initialization\n'))

  // Detect project root
  const projectRoot = process.cwd()
  const router = detectRouter(projectRoot)

  if (router === null) {
    console.log(pc.yellow('⚠ Could not detect Next.js App Router structure.'))
    console.log(pc.dim('Make sure you are in a Next.js project root with an app/ directory.\n'))
  } else if (router === 'pages') {
    console.log(pc.yellow('⚠ Pages Router detected. @nextdevx packages require App Router.\n'))
  } else {
    console.log(pc.dim(`Detected: App Router\n`))
  }

  // Select packages
  const { packages } = await prompts({
    type: 'multiselect',
    name: 'packages',
    message: 'Which packages do you want to install?',
    choices: PACKAGES.map((pkg) => ({
      title: `@nextdevx/${pkg.name}`,
      value: pkg.name,
      description: pkg.description,
    })),
    min: 1,
  })

  if (!packages || packages.length === 0) {
    console.log(pc.yellow('No packages selected. Exiting.'))
    return
  }

  // Select auth provider
  const { authProvider } = await prompts({
    type: 'select',
    name: 'authProvider',
    message: 'Which auth provider are you using?',
    choices: [
      { title: 'Supabase', value: 'supabase' },
      { title: 'Clerk', value: 'clerk' },
      { title: 'NextAuth', value: 'next-auth' },
    ],
  })

  if (!authProvider) {
    console.log(pc.yellow('No auth provider selected. Exiting.'))
    return
  }

  const options: GeneratorOptions = {
    projectRoot,
    authProvider,
  }

  console.log(pc.bold('\nGenerating files...\n'))

  // Generate provider file
  const providerFiles = generateProviderFile(options)
  printGeneratedFiles(providerFiles)

  // Generate files for each selected package
  const allGeneratedFiles: string[] = [...providerFiles]
  for (const packageName of packages) {
    const files = generatePackageFiles(packageName, options)
    allGeneratedFiles.push(...files)
    printGeneratedFiles(files)
    printPrismaSchema(packageName)
  }

  console.log(pc.green(`\n✓ Generated ${allGeneratedFiles.length} files!\n`))

  // Print dependencies to add
  console.log(pc.cyan('Add these dependencies to your package.json:'))
  console.log(pc.dim('  "dependencies": {'))
  console.log(pc.dim('    "@nextdevx/core": "github:nextstack-dev/next-components#main",'))
  for (const packageName of packages) {
    console.log(pc.dim(`    "@nextdevx/${packageName}": "github:nextstack-dev/next-components#main",`))
  }
  console.log(pc.dim('  }'))

  console.log(pc.cyan('\nNext steps:'))
  console.log('1. Run pnpm install')
  console.log('2. Add the Prisma schema additions shown above (if any)')
  console.log('3. Run npx prisma generate && npx prisma db push')
  console.log('4. Import Providers from lib/nextstack-provider.tsx in your layout')
}
