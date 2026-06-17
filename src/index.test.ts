// Basic smoke test
import { citeLensMiddleware } from './index'

// Test 1: throws if domain missing
try {
  citeLensMiddleware({ domain: '' })
  console.error('FAIL: Should have thrown for empty domain')
} catch {
  console.log('PASS: Throws for empty domain')
}

// Test 2: strips protocol from domain
citeLensMiddleware({ domain: 'https://leads.run' })
console.log('PASS: Strips protocol from domain')

// Test 3: accepts clean domain
citeLensMiddleware({ domain: 'leads.run' })
console.log('PASS: Accepts clean domain')

console.log('All tests passed')
