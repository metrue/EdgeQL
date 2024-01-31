import type { GraphQLSchema, ExecutionResult, DocumentNode } from 'graphql'
import { Req } from './request'
import { Res } from './response'
import type { ExecutionContext, Environment, GraphQLRequest } from './types'

export class Context {
  public readonly request: Request
  public readonly env: Environment
  public readonly ctx: ExecutionContext

  private _schema: GraphQLSchema | undefined

  private _map: Record<string, any> | undefined

  public res: Res
  public req: Req | undefined

  constructor(request: Request, env: Environment, ctx: ExecutionContext) {
    this.request = request
    this.env = env
    this.ctx = ctx
    this.res = new Res()
  }

  static async from(
    request: Request,
    env: Environment,
    exeContext: ExecutionContext,
    schema?: GraphQLSchema
  ): Promise<Context> {
    const ctx = new Context(request, env, exeContext)

    ctx.schema = schema
    ctx.res = new Res()
    ctx.req = await Req.from(request)

    return ctx
  }

  get schema(): GraphQLSchema | undefined {
    return this._schema
  }

  set schema(schema: GraphQLSchema | undefined) {
    this._schema = schema
  }

  set(key: string, value: unknown): void {
    this._map ||= {}
    this._map[key] = value
  }

  get(key: string) {
    if (!this._map) {
      return undefined
    }
    return this._map[key]
  }

  json(body?: ExecutionResult | string, init?: ResponseInit): Response {
    if (body) {
      return new Response(JSON.stringify(body), {
        status: 200,
        ...init,
      })
    }
    return new Response(JSON.stringify(this.res?.data), {
      status: this.res?.status ?? 200,
      headers: {
        'Content-Type': 'application/json',
        ...this.res?.headers,
      },
    })
  }
}
