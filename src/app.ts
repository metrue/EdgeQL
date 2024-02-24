import { mergeSchemas } from '@graphql-tools/schema'
import type { GraphQLFieldResolver, GraphQLField, GraphQLSchema } from 'graphql'
import { buildSchema, validateSchema, GraphQLObjectType, execute, GraphQLError } from 'graphql'
import { compose } from './compose'
import { Context } from './context'
import type { ExecutionContext, Environment, Middleware } from './types'

export class EdgeQL {
  private schemas: GraphQLSchema[] = []
  private graph: GraphQLSchema | undefined

  private middlewares: Middleware[] = []

  fetch = async (
    request: Request,
    env?: Environment,
    exeContext?: ExecutionContext
  ): Promise<Response> => {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('GraphQL only supports GET and POST requests.', {
        status: 405,
      })
    }

    let ctx: Context
    try {
      ctx = await Context.create(request, env, exeContext, this.graph)
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

    await compose([...this.middlewares, this.handle])(ctx)

    return ctx.json()
  }

  async handle(ctx: Context) {
    if (!ctx.req?.query) {
      ctx.res.status = 400
      ctx.res.body = {
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
      ctx.res.body = {
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

    if (!ctx.schema) {
      ctx.res.status = 400
      ctx.res.body = {
        data: null,
        errors: [
          new GraphQLError('no schem registerred yet', {
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
      ctx.res.body = res
      return
    } catch (contextError: unknown) {
      ctx.res.status = 500
      ctx.res.body = {
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

  register(schema: GraphQLSchema): void
  register(schema: string, resolve: GraphQLFieldResolver<any, any, any, any>): void
  register(...args: [GraphQLSchema] | [string, GraphQLFieldResolver<any, any, any, any>]): void {
    if (args.length === 1 && typeof args[0] === 'object') {
      const schemaValidationErrors = validateSchema(args[0])
      if (schemaValidationErrors.length > 0) {
        throw new Error(`Invalid schema: ${args[0]}`)
      }
      this.schemas.push(args[0])
    } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'function') {
      const s = buildSchema(args[0])

      const typs = ['Query', 'Mutuation', 'Subscription']
      const fields: GraphQLField<any, any, any>[] = []
      for (const t of typs) {
        const obj = s.getTypeMap()[t]
        if (obj instanceof GraphQLObjectType) {
          for (const f of Object.keys(obj.getFields())) {
            fields.push(obj.getFields()[f])
          }
        }
      }
      if (fields.length !== 1) {
        throw new Error('only one of Query, Mutuation, Subscription is allowed')
      } else {
        fields[0].resolve = args[1]
      }

      this.schemas.push(s)
    } else {
      throw new Error('invalid of parameters for register')
    }

    this.graph = mergeSchemas({ schemas: this.schemas ?? [] })
  }
}
