//import type { DocumentNode } from 'graphql'
import { describe, expect, it } from 'vitest'
import { Req } from './request'
import type { GraphQLRequest } from './types'

describe('request', () => {
  it('from', async () => {
    const graphqlRequest: GraphQLRequest = {
      query: 'query hello { name }',
      variables: {
        id: 1,
      },
      operationName: 'hello',
      extensions: {
        k: 'v',
      },
    }

    const r = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlRequest),
    })

    const req = await Req.from(r)

    expect(req.query).toEqual(graphqlRequest.query)
    expect(req.variables).toEqual(graphqlRequest.variables)
    expect(req.operationName).toEqual(graphqlRequest.operationName)
    expect(req.extensions).toEqual(graphqlRequest.extensions)
    expect(req.document?.kind).toEqual('Document')
  })
})
