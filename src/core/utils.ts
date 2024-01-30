import type { GraphQLRequest } from './types'

export const getGraphQLRequest = async (request: Request): Promise<GraphQLRequest> => {
  const urlData = new URLSearchParams(request.url.split('?')[1])

  // GraphQL Query string.
  const query = urlData.get('query')
  // Parse the variables if needed.
  let variables = urlData.get('variables')
  if (typeof variables === 'string') {
    try {
      variables = JSON.parse(variables)
    } catch {
      throw Error('Variables are invalid JSON.')
    }
  }
  const operationName = urlData.get('operationName')
  //const raw = urlData.get('raw') != null || bodyData.raw !== undefined

  return {
    query: query ?? undefined,
    variables: (variables as any) ?? undefined,
    operationName: operationName ?? undefined,
    //    raw: raw,
  }
}
