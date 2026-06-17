#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

export function cleanDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

export async function checkFilesExist(
  domain: string,
  apiBaseUrl = 'https://citelens.dev'
): Promise<boolean> {
  try {
    const res = await fetch(`${apiBaseUrl}/serve/${domain}/llms.txt`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    return res.ok
  } catch {
    return false
  }
}

export function generateMiddlewareContent(domain: string): string {
  return `import { citeLensMiddleware } from '@citelens/middleware'

export default citeLensMiddleware({
  domain: '${domain}'
})

export const config = {
  matcher: ['/llms.txt', '/llms-full.txt']
}
`
}

// Main CLI flow. Not exported; runs only when the file is executed directly.
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const ask = (question: string): Promise<string> =>
    new Promise(resolve => rl.question(question, resolve))

  console.log('\n@citelens/middleware setup\n')

  const domain = await ask('Your domain (e.g. yourdomain.com): ')
  if (!domain) {
    console.error('Domain is required.')
    rl.close()
    process.exit(1)
  }

  const domainName = cleanDomain(domain)

  console.log('\nChecking CiteLens for your files...')
  const exists = await checkFilesExist(domainName)
  if (!exists) {
    console.log(`
No llms.txt found for ${domainName} on CiteLens.

Generate yours first at:
https://citelens.dev

Then run this command again.
    `)
    rl.close()
    process.exit(1)
  }
  console.log('Files found. Setting up middleware...\n')

  const middlewarePath = path.join(process.cwd(), 'middleware.ts')

  if (fs.existsSync(middlewarePath)) {
    console.log('\nmiddleware.ts already exists.')
    const overwrite = await ask('Add CiteLens to existing middleware manually? See docs at citelens.dev/setup/llms-txt (y/n): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\nSetup cancelled. See citelens.dev/setup/llms-txt for manual setup.')
      rl.close()
      return
    }
  } else {
    fs.writeFileSync(middlewarePath, generateMiddlewareContent(domainName))
    console.log('\nCreated middleware.ts')
  }

  // Record the install. Fire and forget; never blocks or fails the CLI.
  void fetch('https://citelens.dev/api/track/middleware-install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: domainName, version: '0.1.3' }),
    signal: AbortSignal.timeout(3000)
  }).catch(() => {})

  // middleware.ts imports the package, so make sure it's a dependency.
  const installed = fs.existsSync(
    path.join(process.cwd(), 'node_modules', '@citelens', 'middleware')
  )

  console.log(`
Done.${installed ? '' : `

Install the package in your project so the import resolves:
  npm install @citelens/middleware`}

Deploy your site and your llms.txt will be live at:
https://${domainName}/llms.txt
https://${domainName}/llms-full.txt

Generate your llms.txt at citelens.dev if you have not already.
`)

  rl.close()
}

if (require.main === module) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
