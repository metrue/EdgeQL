import type { GraphQLSchema } from 'graphql'
import { Req } from './request'
import { Res } from './response'
import type { ExecutionContext, Environment } from './types'

export class Context {
  public readonly request: Request
  public readonly env: Environment
  public readonly exeCtx: ExecutionContext

  private _schema: GraphQLSchema | undefined

  private _map: Record<string, any> | undefined

  public res: Res
  public req: Req | undefined

  constructor(request: Request, env: Environment, exeCtx: ExecutionContext) {
    this.request = request
    this.env = env
    this.exeCtx = exeCtx
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

  json(): Response {
    return this.res.toJSON()
  }
}
