import { GraphQLObjectType, GraphQLString, GraphQLSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { EdgeQL } from './app'
import type { Context } from './context/context'

describe('App', () => {
  describe('Query', () => {
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
      app.handle(new GraphQLSchema({ query: queryType }))

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
      app.handle(new GraphQLSchema({ query: queryType }))

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
      app.handle(schema, (ctx: Context) => 'world')

      app.handle(
        `
type Query {
  hi: String
}
      `,
        (ctx: Context) => 'world'
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
      app.handle(
        `
type Query {
  hi: String
  hello: String
  ping: String
}
      `,
        {
          hello: async (ctx: Context) => 'world',
          hi: async (ctx: Context) => 'world',
          ping: async (ctx: Context) => 'pong',
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
      app.handle(schema, (ctx: Context) => {
        return `${ctx.runtime?.env?.db} world`
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

  describe('Mutation', () => {
    it('should works when schema and handler given', async () => {
      const app = new EdgeQL()
      const schema = `
input BasketCreateInput {
  id: String
  name: String
  type: String
}

input BasketUpdateInput {
  id: String
  name: String
}

type Basket {
  id: String
  name: String
}


input GQLBasketInput {
  flag: String!
  field1: BasketCreateInput
  field2: BasketUpdateInput
}

type Query {
  hello: String
}
type Mutation {
  addBasket(id: String!, input: GQLBasketInput): Basket
}
    `
      app.handle(schema, {
        hello: (_ctx: Context) => {
          return 'aa'
        },
        addBasket: (ctx: Context) => {
          return {
            id: '1',
            name: 'Bob',
          }
        },
      })

      const req = new Request('http://localhost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation H($id: String!, $input: GQLBasketInput) { 
          addBasket(id: $id, input: $input) {
            name,
            id
          }
        }`,
          variables: {
            id: '1',
            input: {
              flag: 'v0',
              field1: {
                id: '1',
                name: 'Bob',
                type: 'hello',
              },
            },
          },
          operationName: 'H',
          extensions: {},
        }),
      })
      const res = await app.fetch(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({
        data: {
          addBasket: {
            name: 'Bob',
            id: '1',
          },
        },
      })
    })
  })
})
