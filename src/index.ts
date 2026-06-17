import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface CiteLensConfig {
  /**
   * Your domain name without protocol.
   * Example: 'leads.run' not 'https://leads.run'
   */
  domain: string

  /**
   * CiteLens API base URL.
   * Defaults to https://citelens.dev
   * Override only for testing.
   */
  apiBaseUrl?: string

  /**
   * Cache duration in seconds.
   * Defaults to 3600 (1 hour).
   */
  cacheDuration?: number
}

/**
 * CiteLens middleware for Next.js.
 * Serves your llms.txt and llms-full.txt files
 * natively from your domain with no redirects.
 *
 * @example
 * // middleware.ts
 * import { citeLensMiddleware } from '@citelens/middleware'
 *
 * export default citeLensMiddleware({
 *   domain: 'yourdomain.com'
 * })
 *
 * export const config = {
 *   matcher: ['/llms.txt', '/llms-full.txt']
 * }
 */
export function citeLensMiddleware(config: CiteLensConfig) {
  const {
    domain,
    apiBaseUrl = 'https://citelens.dev',
    cacheDuration = 3600
  } = config

  if (!domain) {
    throw new Error(
      '@citelens/middleware: domain is required. ' +
      'Example: citeLensMiddleware({ domain: "yourdomain.com" })'
    )
  }

  // Strip protocol if accidentally included
  const cleanDomain = domain
    .replace('https://', '')
    .replace('http://', '')
    .replace('www.', '')
    .replace(/\/$/, '')

  return async function middleware(
    request: NextRequest
  ): Promise<NextResponse> {
    const { pathname } = request.nextUrl

    // Only handle llms.txt and llms-full.txt
    if (
      pathname !== '/llms.txt' &&
      pathname !== '/llms-full.txt'
    ) {
      return NextResponse.next()
    }

    const filename = pathname.slice(1) // remove leading /
    const citeLensUrl =
      `${apiBaseUrl}/serve/${cleanDomain}/${filename}`

    try {
      // `next` is the Next.js fetch-cache extension; type it explicitly so the
      // package compiles standalone (outside a Next.js app's type augmentation).
      const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
        headers: {
          'User-Agent':
            `@citelens/middleware/0.1.0 (+${apiBaseUrl}; domain=${cleanDomain})`
        },
        // Next.js fetch cache
        next: { revalidate: cacheDuration }
      }
      const response = await fetch(citeLensUrl, fetchInit)

      // If CiteLens doesn't have a file for this domain
      // fall through to Next.js default handling
      if (!response.ok) {
        console.warn(
          `@citelens/middleware: No ${filename} found for ${cleanDomain}. ` +
          `Generate one at ${apiBaseUrl}`
        )
        return NextResponse.next()
      }

      const content = await response.text()

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control':
            `public, max-age=${cacheDuration}, stale-while-revalidate=86400`,
          'X-Served-By': 'CiteLens',
          'X-CiteLens-Domain': cleanDomain,
        }
      })

    } catch (error) {
      // Never break the site if CiteLens is unreachable
      // Fall through to Next.js default handling
      console.error(
        `@citelens/middleware: Failed to fetch ${filename} for ${cleanDomain}:`,
        error instanceof Error ? error.message : error
      )
      return NextResponse.next()
    }
  }
}

// Re-export NextResponse for convenience
export { NextResponse }
