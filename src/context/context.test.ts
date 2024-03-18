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

  it('set and get', () => {
    const ctx = new Context(
      new Request('http://localhost'),
      { Bindings: {}, Variables: {} },
      { waitUntil: () => {}, passThroughOnException: () => {} }
    )
    ctx.set('k', 'v')
    expect(ctx).not.toBe(null)
    expect(ctx.get('k')).toBe('v')
  })

  it('json', async () => {
    const ctx = new Context(
      new Request('http://localhost'),
      { Bindings: {}, Variables: {} },
      { waitUntil: () => {}, passThroughOnException: () => {} }
    )
    ctx.http.body = { data: 'test' }
    const res = ctx.json()
    expect(res.headers.get('content-type')).toEqual('application/json')
    expect(await res.json()).toEqual({
      data: 'test',
    })
  })

  it('html', async () => {
    const ctx = new Context(
      new Request('http://localhost'),
      { Bindings: {}, Variables: {} },
      { waitUntil: () => {}, passThroughOnException: () => {} }
    )
    ctx.http.body = 'hello world'
    const res = ctx.html()
    expect(res.headers.get('content-type')).toEqual('text/html')
    expect(await res.text()).toEqual('hello world')
  })

  it('text', async () => {
    const ctx = new Context(
      new Request('http://localhost'),
      { Bindings: {}, Variables: {} },
      { waitUntil: () => {}, passThroughOnException: () => {} }
    )
    ctx.http.body = 'hello world'
    const res = ctx.text()
    expect(res.headers.get('content-type')).toEqual('text/plain')
    expect(await res.text()).toEqual('hello world')
  })
})
