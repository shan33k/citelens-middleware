#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve))
}

async function main() {
  console.log('\n@citelens/middleware setup\n')

  // Get domain
  const domain = await ask('Your domain (e.g. yourdomain.com): ')

  if (!domain) {
    console.error('Domain is required.')
    process.exit(1)
  }

  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase()

  const middlewareContent = `import { citeLensMiddleware } from '@citelens/middleware'

export default citeLensMiddleware({
  domain: '${cleanDomain}'
})

export const config = {
  matcher: ['/llms.txt', '/llms-full.txt']
}
`

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
    fs.writeFileSync(middlewarePath, middlewareContent)
    console.log('\nCreated middleware.ts')
  }

  console.log(`
Done. Deploy your site and your llms.txt will be live at:
https://${cleanDomain}/llms.txt
https://${cleanDomain}/llms-full.txt

Generate your llms.txt at citelens.dev if you have not already.
`)

  rl.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
