import { GraphQLObjectType, GraphQLString, GraphQLSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { EdgeQL } from './app'

describe('App', () => {
  it('should fail when no schema registered', async () => {
    const app = new EdgeQL()
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

  it('should work when schema registered', async () => {
    const app = new EdgeQL()
    const queryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: GraphQLString,
          resolve: () => 'world',
        },
      },
    })
    app.register(new GraphQLSchema({ query: queryType }))

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hello }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hello: 'world',
      },
    })
  })

  it('should work when schema registered with async resolve function', async () => {
    const app = new EdgeQL()
    const queryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: GraphQLString,
          resolve: async () => {
            return new Promise((res) => {
              res('world')
            })
          },
        },
      },
    })
    app.register(new GraphQLSchema({ query: queryType }))

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hello }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hello: 'world',
      },
    })
  })

  it('should work when schema string registered', async () => {
    const app = new EdgeQL()
    const schema = `
type Query {
  hello: String
}
    `
    app.register(schema, () => 'world')

    app.register(
      `
type Query {
  hi: String
}
      `,
      () => 'world'
    )

    let req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hello }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    let res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hello: 'world',
      },
    })

    req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hi }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hi: 'world',
      },
    })
  })

  it('should work when schema string mulitiple query registered', async () => {
    const app = new EdgeQL()
    app.register(
      `
type Query {
  hi: String
  hello: String
  ping: String
}
      `,
      {
        hello: () => 'world',
        hi: () => 'world',
        ping: () => 'pong',
      }
    )

    let req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hello }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    let res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hello: 'world',
      },
    })

    req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hi }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hi: 'world',
      },
    })

    req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query H { 
          hi
          ping
        }`,
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hi: 'world',
        ping: 'pong',
      },
    })
  })
  it('should be able to get the environment variable inside handler', async () => {
    const app = new EdgeQL()
    const schema = `
type Query {
  hello: String
}
    `
    app.register(schema, (parent, args, ctx) => {
      return `${ctx.env.db} world`
    })
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query H { hello }',
        variables: {},
        operationName: 'H',
        extensions: {},
      }),
    })
    const db = 'hello-db'
    const res = await app.fetch(req, { db })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        hello: `${db} world`,
      },
    })
  })
})
