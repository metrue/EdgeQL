import { describe, expect, it } from 'vitest'
import { EdgeQL } from '../../index'
import type { Context } from '../../index'
import { cors } from '../../middleware/cors'

describe('CORS by Middleware', () => {
  it('GET default', async () => {
    const app = new EdgeQL()

    app.handle(
      `
type Query {
  hello: String
}
    `,
      (ctx: Context) => {
        return `hello from ${ctx.runtime.runtime}`
      }
    )
    app.use(cors())
    const res = await app.fetch(new Request('http://localhost'))

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(res.headers.get('Vary')).toBeNull()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      data: null,
      errors: [
        {
          extensions: {
            status: 400,
          },
          message: 'Must provide query string',
        },
      ],
    })
  })

  it('Preflight default', async () => {
    const app = new EdgeQL()

    app.handle(
      `
type Query {
  hello: String
}
    `,
      (ctx: Context) => {
        return `hello from ${ctx.runtime.runtime}`
      }
    )
    app.use(cors())
    app.use(
      cors({
        origin: 'http://example.com',
        allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
        maxAge: 600,
        credentials: true,
      })
    )

    const req = new Request('http://example.com', { method: 'OPTIONS' })
    req.headers.append('Access-Control-Request-Headers', 'X-PINGOTHER, Content-Type')
    const res = await app.fetch(req)

    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')?.split(',')[0]).toBe('GET')
    expect(res.headers.get('Access-Control-Allow-Headers')?.split(',')).toEqual([
      'X-PINGOTHER',
      'Content-Type',
    ])
  })
})
