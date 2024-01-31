import { validateSchema, execute, GraphQLError } from 'graphql'
import type { GraphQLSchema } from 'graphql'
import { compose } from './compose'
import { Context } from './context'
import type { ExecutionContext, Environment, Middleware } from './types'

export class Yo {
  public graph!: GraphQLSchema

  private middlewares: Middleware[] = []

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
    let ctx: Context
    try {
      ctx = await Context.from(request, env, exeContext, this.graph)
    } catch (e) {
      return new Response(
        JSON.stringify({
          data: null,
          errors: [
            new GraphQLError(`GraphQL params error: ${e}`, {
              extensions: {
                status: 400,
              },
            }),
          ],
        })
      )
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return ctx.json('GraphQL only supports GET and POST requests.', {
        status: 405,
      })
    }

    await compose([...this.middlewares, this.handle])(ctx)
    return ctx.json()
  }

  async handle(ctx: Context) {
    if (!ctx.req?.query) {
      ctx.res.status = 400
      ctx.res.data = {
        data: null,
        errors: [
          new GraphQLError('Must provide query string', {
            extensions: {
              status: 400,
            },
          }),
        ],
      }
      return
    }

    if (!ctx.req?.document) {
      ctx.res.status = 400
      ctx.res.data = {
        data: null,
        errors: [
          new GraphQLError(`could not generate document from query: ${ctx.req?.query}`, {
            extensions: {
              status: 400,
            },
          }),
        ],
      }
      return
    }

    try {
      const res = await execute({
        schema: ctx.schema!,
        document: ctx.req?.document ?? null,
        rootValue: null,
        contextValue: ctx,
        variableValues: ctx.req?.variables,
        operationName: ctx.req?.operationName,
      })
      ctx.res.status = 200
      ctx.res.data = res
      return
    } catch (contextError: unknown) {
      ctx.res.status = 500
      ctx.res.data = {
        data: null,
        errors: [
          new GraphQLError(`GraphQL execution context error: ${contextError}`, {
            extensions: {
              status: 500,
            },
          }),
        ],
      }
    }
  }

  use(fn: Middleware) {
    this.middlewares.push(fn)
  }
}
