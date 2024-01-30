import { GraphQLRequest } from './types'

export const getGraphQLRequest = async (request: Request): Promise<GraphQLRequest> => {
  const urlData = new URLSearchParams(request.url.split('?')[1])
  const bodyData = await parseBody(request)

  // GraphQL Query string.
  let query = urlData.get('query') ?? (bodyData.query as string | undefined)

  if (typeof query !== 'string') {
    query = undefined
  }

  // Parse the variables if needed.
  let variables = (urlData.get('variables') ?? bodyData.variables) as {
    readonly [name: string]: unknown
  } | undefined
  if (typeof variables === 'string') {
    try {
      variables = JSON.parse(variables)
    } catch {
      throw Error('Variables are invalid JSON.')
    }
  } else if (typeof variables !== 'object') {
    variables = undefined
  }

  // Name of GraphQL operation to execute.
  let operationName = urlData.get('operationName') ?? (bodyData.operationName as string | undefined)
  if (typeof operationName !== 'string') {
    operationName = undefined
  }

  //const raw = urlData.get('raw') != null || bodyData.raw !== undefined

  const params: GraphQLRequest = {
    query: query,
    variables: variables,
    operationName: operationName,
//    raw: raw,
  }

  return params
}

const parseFormURL = async (req: Request) => {
  const text = await req.text()
  const searchParams = new URLSearchParams(text)
  const res: { [params: string]: string } = {}
  searchParams.forEach((v, k) => (res[k] = v))
  return res
}

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get('content-type')

  switch (contentType) {
    case 'application/graphql':
      return { query: await req.text() }
    case 'application/json':
      try {
        return await req.json()
      } catch (e) {
        if (e instanceof Error) {
          console.error(`${e.stack || e.message}`)
        }
        throw Error(`POST body sent invalid JSON: ${e}`)
      }
    case 'application/x-www-form-urlencoded':
      return parseFormURL(req)
  }

  return {}
}
