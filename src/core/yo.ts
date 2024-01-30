import { validateSchema, execute, GraphQLError } from 'graphql'
import type { GraphQLSchema } from 'graphql'
import { Context } from './context'
import type { ExecutionContext, Environment } from './types'

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
    exeContext: ExecutionContext
  ): Promise<Response> => {
    const ctx = new Context(request, env, exeContext, this.graph)

    if (request.method !== 'GET' && request.method !== 'POST') {
      return ctx.json('GraphQL only supports GET and POST requests.', {
        status: 405,
      })
    }

    try {
      await ctx.process()
    } catch (e) {
      return ctx.json({
        data: null,
        errors: [
          new GraphQLError(`GraphQL params error: ${e}`, {
            extensions: {
              status: 400,
            },
          }),
        ],
      })
    }

    return await this.handle(ctx)
  }

  async handle(ctx: Context): Promise<Response> {
    if (!ctx.query) {
      return ctx.json({
        data: null,
        errors: [
          new GraphQLError('Must provide query string', {
            extensions: {
              status: 400,
            },
          }),
        ],
      })
    }

    if (!ctx.document) {
      return ctx.json({
        data: null,
        errors: [
          new GraphQLError(`could not generate document from query: ${ctx.query}`, {
            extensions: {
              status: 400,
            },
          }),
        ],
      })
    }

    try {
      const res = await execute({
        schema: this.graph,
        document: ctx.document ?? null,
        rootValue: null,
        contextValue: ctx.request,
        variableValues: ctx.variables,
        operationName: ctx.operationName,
      })
      return ctx.json(res)
    } catch (contextError: unknown) {
      return ctx.json({
        data: null,
        errors: [
          new GraphQLError(`GraphQL execution context error: ${contextError}`, {
            extensions: {
              status: 500,
            },
          }),
        ],
      })
    }
  }
}
