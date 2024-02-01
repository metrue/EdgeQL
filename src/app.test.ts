import { describe, expect, it } from 'vitest'
import { Yo } from './app'

describe('App', () => {
  it('should fail when no schema registered', async () => {
    const app = new Yo()
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
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      data: null,
      errors: [
        {
          extensions: {
            status: 400,
          },
          message: 'no schem registerred yet',
        },
      ],
    })
  })
})
