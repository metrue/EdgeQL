import { validateSchema, Source, parse, execute, GraphQLError } from 'graphql'
import type { GraphQLSchema, ExecutionResult, DocumentNode } from 'graphql'
import type { ExecutionContext, Environment } from '../types'
import type { GraphQLRequest } from './types'

export default class Yo {
  public graph!: GraphQLSchema

  register({ schema }: { schema: GraphQLSchema }) {
    const schemaValidationErrors = validateSchema(schema)
    if (schemaValidationErrors.length > 0) {
      throw new Error(`Invalid schema: ${schema}`)
    }

    // merge schema to graph
    this.graph = schema
  }

  fetch = async (request: Request, env: Environment, ctx: ExecutionContext): Promise<Response> => {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('GraphQL only supports GET and POST requests.', {
        status: 405,
      })
    }
    const res = await this.handle(request)
    if (res.extensions?.status) {
      return new Response(JSON.stringify(res), {
        status: Number(res.extensions.status),
      })
    }
    return new Response(JSON.stringify(res), {
      status: 200,
    })
  }

  async handle(request: Request): Promise<ExecutionResult> {
    let req: GraphQLRequest
    try {
      const contentType = request.headers.get('content-type')

      switch (contentType) {
        case 'application/graphql':
          req = { query: await request.text() }
          break
        case 'application/json': {
          try {
            req = await request.json()
          } catch (e) {
            if (e instanceof Error) {
              console.error(`${e.stack || e.message}`)
            }
            throw Error(`POST body sent invalid JSON: ${e}`)
          }
          break
        }
        case 'application/x-www-form-urlencoded': {
          const text = await request.text()
          const searchParams = new URLSearchParams(text)
          const res: { [params: string]: string } = {}
          searchParams.forEach((v, k) => (res[k] = v))
          req = res
          break
        }
        default:
          return {
            data: null,
            errors: [
              new GraphQLError('invalid content type of request', {
                extensions: {
                  status: 400,
                },
              }),
            ],
          }
      }
    } catch (e) {
      return {
        data: null,
        errors: [
          new GraphQLError(`GraphQL params error: ${e}`, {
            extensions: {
              status: 400,
            },
          }),
        ],
      }
    }

    if (!req.query) {
      return {
        data: null,
        errors: [
          new GraphQLError('Must provide query string', {
            extensions: {
              status: 400,
            },
          }),
        ],
      }
    }

    let documentAST: DocumentNode
    try {
      documentAST = parse(new Source(req.query, 'GraphQL request'))
    } catch (syntaxError: unknown) {
      if (syntaxError instanceof Error) {
        console.error(`${syntaxError.stack || syntaxError.message}`)
      }

      return {
        data: null,
        errors: [
          new GraphQLError(`GraphQL syntax error.: ${syntaxError}`, {
            extensions: {
              status: 400,
            },
          }),
        ],
      }
    }

    try {
      return await execute({
        schema: this.graph,
        document: documentAST,
        rootValue: null,
        contextValue: request,
        variableValues: req.variables,
        operationName: req.operationName,
      })
    } catch (contextError: unknown) {
      const res: ExecutionResult = {
        data: null,
        errors: [
          new GraphQLError(`GraphQL execution context error: ${contextError}`, {
            extensions: {
              status: 500,
            },
          }),
        ],
      }
      return res
    }
  }
}
