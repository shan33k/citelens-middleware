# @citelens/middleware

Serve your CiteLens-hosted llms.txt and llms-full.txt
natively in Next.js. No redirects. No vercel.json changes.
Files appear to live on your domain and update automatically.

## What is llms.txt?

llms.txt is the emerging standard for making websites
readable by AI systems like ChatGPT, Claude, and Perplexity.
It tells AI crawlers exactly what your site does and where
your best content lives.

CiteLens generates, hosts, and maintains your llms.txt
automatically. This middleware package serves it natively
from your domain.

## Installation

```bash
npm install @citelens/middleware
```

## Setup

Create or update middleware.ts at your project root:

```typescript
import { citeLensMiddleware } from '@citelens/middleware'

export default citeLensMiddleware({
  domain: 'yourdomain.com'
})

export const config = {
  matcher: ['/llms.txt', '/llms-full.txt']
}
```

Deploy and your files are live at:
- yourdomain.com/llms.txt
- yourdomain.com/llms-full.txt

## Configuration

```typescript
citeLensMiddleware({
  // Required: your domain without protocol
  domain: 'yourdomain.com',

  // Optional: cache duration in seconds (default: 3600)
  cacheDuration: 3600,
})
```

## How it works

The middleware intercepts requests to /llms.txt and
/llms-full.txt and serves the latest content from
CiteLens servers. The files appear to live natively
on your domain with no visible redirect.

CiteLens regenerates your files every Monday based
on your latest site content. You never need to
touch them again.

## Requirements

- Next.js 14 or later
- A CiteLens account with generated llms.txt files

Generate yours free at citelens.dev

## If you have an existing middleware.ts

Compose with your existing middleware:

```typescript
import { citeLensMiddleware } from '@citelens/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const handleCiteLens = citeLensMiddleware({
  domain: 'yourdomain.com'
})

export async function middleware(request: NextRequest) {
  // Handle llms.txt files first
  if (
    request.nextUrl.pathname === '/llms.txt' ||
    request.nextUrl.pathname === '/llms-full.txt'
  ) {
    return handleCiteLens(request)
  }

  // Your existing middleware logic here
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/llms.txt',
    '/llms-full.txt',
    // your other matchers
  ]
}
```

## License

MIT

## Links

- Generate your llms.txt: https://citelens.dev
- Setup guide: https://citelens.dev/setup/llms-txt
- Support: shane@citelens.dev
