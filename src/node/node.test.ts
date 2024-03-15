import { GraphQLObjectType, GraphQLString, GraphQLSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { NodeEdgeQL } from './node'

describe('NodeEdgeQL', () => {
  describe('Query', () => {
    it('should work when schema registered', async () => {
      const app = new NodeEdgeQL()
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
    // TODO test should cover the listen function, with supertest
  })
})
