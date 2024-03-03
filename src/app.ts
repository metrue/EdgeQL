import { mergeSchemas } from '@graphql-tools/schema'
import type { GraphQLField, GraphQLSchema } from 'graphql'
import { buildSchema, validateSchema, GraphQLObjectType, execute, GraphQLError } from 'graphql'
import { compose } from './compose'
import { Context } from './context/context'
import type { ExecutionContext, Environment, Middleware, Handler } from './types'

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
      ctx = new Context(request, env, exeContext)
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

    await ctx.graphql.init(ctx.http.request)
    ctx.graphql.schema = this.graph

    await compose([...this.middlewares, this.execute])(ctx)

    return ctx.json()
  }

  private async execute(ctx: Context) {
    if (!ctx.graphql.query) {
      ctx.http.status = 400
      ctx.http.body = {
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

    if (!ctx.graphql.document) {
      ctx.http.status = 400
      ctx.http.body = {
        data: null,
        errors: [
          new GraphQLError(`could not generate document from query: ${ctx.graphql.query}`, {
            extensions: {
              status: 400,
            },
          }),
        ],
      }
      return
    }

    if (!ctx.graphql.schema) {
      ctx.http.status = 400
      ctx.http.body = {
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
        schema: ctx.graphql.schema!,
        document: ctx.graphql.document ?? null,
        rootValue: null,
        contextValue: ctx,
        variableValues: ctx.graphql.variables,
        operationName: ctx.graphql.operationName,
      })
      ctx.http.status = 200
      ctx.http.body = res
      return
    } catch (contextError: unknown) {
      ctx.http.status = 500
      ctx.http.body = {
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

  handle(schema: GraphQLSchema): void
  handle(schema: string, handler: Handler): void
  handle(schema: string, handlers: Record<string, Handler>): void
  handle(...args: [GraphQLSchema] | [string, Handler] | [string, Record<string, Handler>]): void {
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
        fields[0].resolve = async (parents: any, arg: any, ctx: Context, info: any) => {
          ctx.graphql.args = arg
          ctx.graphql.parents = parents
          ctx.graphql.info = info
          return await (args[1] as Handler)(ctx)
        }
      }

      this.schemas.push(s)
    } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'object') {
      const s = buildSchema(args[0])

      const typs = ['Query', 'Mutuation', 'Subscription']
      for (const t of typs) {
        const obj = s.getTypeMap()[t]
        if (obj instanceof GraphQLObjectType) {
          for (const f of Object.keys(obj.getFields())) {
            if (args[1][f]) {
              obj.getFields()[f].resolve = async (
                parents: any,
                arg: any,
                ctx: Context,
                info: any
              ) => {
                ctx.graphql.parents = parents
                ctx.graphql.args = arg
                ctx.graphql.info = info
                const fn = (args[1] as any)[f] as Handler
                return await fn(ctx)
              }
            } else {
              throw new Error(`no resolve function for ${obj.getFields()[f]}`)
            }
          }
        }
      }

      this.schemas.push(s)
    } else {
      throw new Error('invalid of parameters for register')
    }

    this.graph = mergeSchemas({ schemas: this.schemas ?? [] })
  }
}
