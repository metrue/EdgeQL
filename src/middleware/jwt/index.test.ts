/**
 * @jest-environment edge-runtime
 */
import { describe, expect, it } from 'vitest'
import { EdgeQL } from '../../'
import { jwt } from '.'

describe('JWT', () => {
  it('should unauthorize when no credentials in header', async () => {
    const app = new EdgeQL()
    app.handle(
      `
type Query {
  name: String
}
      `,
      () => 'EdgeQL'
    )
    app.use(jwt({ secret: 'a-secret' }))

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { name }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(401)
    expect(res.statusText).toBe('Unauthorized')
  })

  it('should unauthorize when invalid token', async () => {
    const app = new EdgeQL()
    app.handle(
      `
type Query {
  name: String
}
      `,
      () => 'EdgeQL'
    )
    app.use
    app.use(jwt({ secret: 'a-secret' }))

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer xxx',
      },
      body: JSON.stringify({
        query: 'query H { name }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(401)
    expect(res.statusText).toBe('JwtTokenInvalid: invalid JWT token: xxx')
  })

  it('should authorize', async () => {
    const app = new EdgeQL()
    app.handle(
      `
type Query {
  name: String
}
      `,
      () => 'EdgeQL'
    )
    app.use
    app.use(jwt({ secret: 'a-secret' }))

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZXNzYWdlIjoiaGVsbG8gd29ybGQifQ.B54pAqIiLbu170tGQ1rY06Twv__0qSHTA0ioQPIOvFE',
      },
      body: JSON.stringify({
        query: 'query H { name }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        name: 'EdgeQL',
      },
    })
  })
})
