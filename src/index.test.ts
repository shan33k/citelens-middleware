import { citeLensMiddleware } from './index'

describe('citeLensMiddleware', () => {
  it('throws if domain is empty', () => {
    expect(() => citeLensMiddleware({ domain: '' })).toThrow()
  })

  it('accepts a domain with a protocol prefix', () => {
    expect(() => citeLensMiddleware({ domain: 'https://leads.run' })).not.toThrow()
  })

  it('accepts a clean domain', () => {
    expect(() => citeLensMiddleware({ domain: 'leads.run' })).not.toThrow()
  })
})
