import { describe, expect, it } from 'vitest'
import { Context } from './context'

describe('context', () => {
  it('should be defined', () => {
    const ctx = new Context(
      new Request('http://localhost'),
      { Bindings: {}, Variables: {} },
      { waitUntil: () => {}, passThroughOnException: () => {} }
    )
    expect(ctx).not.toBe(null)
  })
})
