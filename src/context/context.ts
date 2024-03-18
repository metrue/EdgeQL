import type { ExecutionContext, Environment } from '../types'
import { GraphQLContext } from './graphql'
import { HttpContext } from './http'
import { RuntimeContext } from './runtime'

export class Context {
  public readonly runtime: RuntimeContext
  public readonly http: HttpContext
  public readonly graphql: GraphQLContext

  private _map: Record<string, any> | undefined

  constructor(request: Request, env?: Environment, exeContext?: ExecutionContext) {
    this.runtime = new RuntimeContext(env, exeContext)
    this.http = new HttpContext(request)
    this.graphql = new GraphQLContext()
  }

  json(): Response {
    return this.http.toJSON()
  }

  html(): Response {
    return this.http.toHtml()
  }

  text(): Response {
    return this.http.toText()
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
}
