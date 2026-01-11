import * as fs from 'fs'
import * as path from 'path'

/**
 * Ensure directory exists, creating it if necessary
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Write file with directory creation
 */
export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

/**
 * Read file contents
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * Detect if project uses App Router or Pages Router
 */
export function detectRouter(projectRoot: string): 'app' | 'pages' | null {
  const appDir = path.join(projectRoot, 'app')
  const srcAppDir = path.join(projectRoot, 'src', 'app')
  const pagesDir = path.join(projectRoot, 'pages')
  const srcPagesDir = path.join(projectRoot, 'src', 'pages')

  if (fs.existsSync(appDir) || fs.existsSync(srcAppDir)) {
    return 'app'
  }
  if (fs.existsSync(pagesDir) || fs.existsSync(srcPagesDir)) {
    return 'pages'
  }
  return null
}

/**
 * Get the API directory path based on router type
 */
export function getApiPath(projectRoot: string): string {
  const srcApp = path.join(projectRoot, 'src', 'app')
  const app = path.join(projectRoot, 'app')

  if (fs.existsSync(srcApp)) {
    return path.join(srcApp, 'api')
  }
  if (fs.existsSync(app)) {
    return path.join(app, 'api')
  }

  // Default to src/app/api
  return path.join(projectRoot, 'src', 'app', 'api')
}

/**
 * Get the lib directory path
 */
export function getLibPath(projectRoot: string): string {
  const srcLib = path.join(projectRoot, 'src', 'lib')
  const lib = path.join(projectRoot, 'lib')

  if (fs.existsSync(srcLib)) {
    return srcLib
  }
  if (fs.existsSync(lib)) {
    return lib
  }

  // Default to src/lib
  return path.join(projectRoot, 'src', 'lib')
}
