import { cleanDomain, checkFilesExist, generateMiddlewareContent } from './cli'

// Mock fetch globally
global.fetch = jest.fn() as unknown as typeof fetch

describe('citelens-setup CLI', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('domain cleaning', () => {
    it('strips https:// from domain', () => {
      expect(cleanDomain('https://leads.run')).toBe('leads.run')
    })

    it('strips http:// from domain', () => {
      expect(cleanDomain('http://leads.run')).toBe('leads.run')
    })

    it('strips www. from domain', () => {
      expect(cleanDomain('www.leads.run')).toBe('leads.run')
    })

    it('strips trailing slash', () => {
      expect(cleanDomain('leads.run/')).toBe('leads.run')
    })

    it('lowercases domain', () => {
      expect(cleanDomain('Leads.Run')).toBe('leads.run')
    })

    it('leaves clean domain unchanged', () => {
      expect(cleanDomain('leads.run')).toBe('leads.run')
    })
  })

  describe('file verification', () => {
    it('passes when CiteLens returns 200', async () => {
      ;(fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      })

      const result = await checkFilesExist('leads.run')
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://citelens.dev/serve/leads.run/llms.txt',
        expect.objectContaining({ method: 'HEAD' })
      )
    })

    it('fails when CiteLens returns 404', async () => {
      ;(fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await checkFilesExist('notareal.domain')
      expect(result).toBe(false)
    })

    it('fails gracefully when network is unreachable', async () => {
      ;(fetch as unknown as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await checkFilesExist('leads.run')
      expect(result).toBe(false)
    })
  })

  describe('middleware.ts generation', () => {
    it('generates correct content for a domain', () => {
      const content = generateMiddlewareContent('leads.run')
      expect(content).toContain("domain: 'leads.run'")
      expect(content).toContain('@citelens/middleware')
      expect(content).toContain('/llms.txt')
      expect(content).toContain('/llms-full.txt')
    })

    it('does not contain placeholder domain', () => {
      const content = generateMiddlewareContent('leads.run')
      expect(content).not.toContain('yourdomain.com')
    })
  })

})
