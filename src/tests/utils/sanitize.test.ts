import { describe, it, expect } from 'vitest'
import { sanitizeInput, sanitizeHtml, validateEmail, validatePhone, validateUrl } from '@/lib/sanitize'

describe('sanitizeInput', () => {
  it('escapes HTML characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
  })
})

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<p>Hello</p><script>alert("xss")</script>'))
      .toBe('<p>Hello</p>')
  })

  it('removes javascript: URLs', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">Click</a>'))
      .toBe('<a href="">Click</a>')
  })
})

describe('validateEmail', () => {
  it('validates correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('validates Nigerian phone number', () => {
    expect(validatePhone('+2348012345678')).toBe(true)
    expect(validatePhone('08012345678')).toBe(true)
  })
})

describe('validateUrl', () => {
  it('validates correct URL', () => {
    expect(validateUrl('https://example.com')).toBe(true)
  })

  it('rejects invalid URL', () => {
    expect(validateUrl('javascript:alert(1)')).toBe(false)
    expect(validateUrl('not-a-url')).toBe(false)
  })
})