/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {
  Source,
  parse,
  execute,
  validateSchema,
  validate,
  specifiedRules,
  getOperationAST,
  GraphQLError,
  buildSchema,
} from 'graphql'

import type {
  GraphQLSchema,
  DocumentNode,
  ValidationRule,
  FormattedExecutionResult,
  GraphQLFormattedError,
} from 'graphql'



export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

const schema = buildSchema(`
    type Query {
      hello: String
    }
`)

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
    console.log('a-----')

    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('GraphQL only supports GET and POST requests.', {
        status: 405,
      })
    }

    let params: GraphQLParams
    try {
      params = await getGraphQLParams(request)
    } catch (e) {
      return new Response(`invalid GraphQL params: ${e}`, {
        status: 400,
      })
    }

    const { query, variables, operationName } = params
    console.warn('=========')
    console.warn(query, variables, operationName)
    console.warn('=========')
    if (query == null) {
      return new Response(`Must provide query string`, {
        status: 400,
      })
    }

    const schemaValidationErrors = validateSchema(schema)
    if (schemaValidationErrors.length > 0) {
      return new Response(`GraphQL schema validation error.`, {
        status: 400,
      })
    }

    let documentAST: DocumentNode
    try {
      documentAST = parse(new Source(query, 'GraphQL request'))
    } catch (syntaxError: unknown) {
      if (syntaxError instanceof Error) {
        console.error(`${syntaxError.stack || syntaxError.message}`)
      }
      return new Response(`GraphQL syntax error.: ${syntaxError}`, {
        status: 400
      })
    }

    let result
    try {
      result = await execute({
        schema,
        document: documentAST,
        rootValue: null,
        contextValue: request,
        variableValues: variables,
        operationName: operationName,
      })
    } catch (contextError: unknown) {
      return new Response(`GraphQL execution context error: ${contextError}`, {
        status: 500
      })
    }

		return new Response(JSON.stringify(result));
	},
};


export interface GraphQLParams {
  query: string | null
  variables: { readonly [name: string]: unknown } | null
  operationName: string | null
  raw: boolean
}

export const getGraphQLParams = async (request: Request): Promise<GraphQLParams> => {
  const urlData = new URLSearchParams(request.url.split('?')[1])
  const bodyData = await parseBody(request)

  // GraphQL Query string.
  let query = urlData.get('query') ?? (bodyData.query as string | null)

  if (typeof query !== 'string') {
    query = null
  }

  // Parse the variables if needed.
  let variables = (urlData.get('variables') ?? bodyData.variables) as {
    readonly [name: string]: unknown
  } | null
  if (typeof variables === 'string') {
    try {
      variables = JSON.parse(variables)
    } catch {
      throw Error('Variables are invalid JSON.')
    }
  } else if (typeof variables !== 'object') {
    variables = null
  }

  // Name of GraphQL operation to execute.
  let operationName = urlData.get('operationName') ?? (bodyData.operationName as string | null)
  if (typeof operationName !== 'string') {
    operationName = null
  }

  const raw = urlData.get('raw') != null || bodyData.raw !== undefined

  const params: GraphQLParams = {
    query: query,
    variables: variables,
    operationName: operationName,
    raw: raw,
  }

  return params
}

// export const graphiQLResponse = () => {}
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

const parseFormURL = async (req: Request) => {
  const text = await req.text()
  const searchParams = new URLSearchParams(text)
  const res: { [params: string]: string } = {}
  searchParams.forEach((v, k) => (res[k] = v))
  return res
}
