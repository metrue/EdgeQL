import {
	GraphQLSchema,
  validateSchema,
  Source,
  DocumentNode,
  parse,
  ExecutionResult,
  execute,
  GraphQLError,
} from 'graphql'
import { ExecutionContext, Environment } from '../types';
import { GraphQLRequest} from './types'
import { getGraphQLRequest } from './utils'

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

	fetch = async (
		request: Request,
		env: Environment,
		ctx: ExecutionContext
	): Promise<Response> => {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('GraphQL only supports GET and POST requests.', {
        status: 405,
      })
    }
    const res = await this.handle(request)
    if (res.extensions?.status) {
		  return new Response(JSON.stringify(res), {
        status: Number(res.extensions.status),
		  });
    }
		return new Response(JSON.stringify(res), {
      status: 200,
		});
  }

	async handle(request: Request): Promise<ExecutionResult> {
    let params: GraphQLRequest
    try {
      params = await getGraphQLRequest(request)
    } catch (e) {
      return {
        data: null,
        errors: [
          new GraphQLError(`GraphQL params error: ${e}`, {
            extensions: {
              status: 400
            }
          })
        ]
      }
    }

    const { query, variables, operationName } = params
    if (!query) {
      return {
        data: null,
        errors: [
          new GraphQLError(`Must provide query string`, {
            extensions: {
              status: 400
            }
          })
        ]
      }
    }

    let documentAST: DocumentNode
    try {
      documentAST = parse(new Source(query, 'GraphQL request'))
    } catch (syntaxError: unknown) {
      if (syntaxError instanceof Error) {
        console.error(`${syntaxError.stack || syntaxError.message}`)
      }

      return {
        data: null,
        errors: [
          new GraphQLError(`GraphQL syntax error.: ${syntaxError}`, {
            extensions: {
              status: 400
            }
          })
        ]
      }
    }

    let result
    try {
      return await execute({
        schema: this.graph,
        document: documentAST,
        rootValue: null,
        contextValue: request,
        variableValues: variables,
        operationName: operationName,
      })
    } catch (contextError: unknown) {
      const res: ExecutionResult = {
        data: null,
        errors: [
          new GraphQLError(`GraphQL execution context error: ${contextError}`, {
            extensions: {
              status: 500
            }
          })
        ]
      }
      return res
    }
	}
}
