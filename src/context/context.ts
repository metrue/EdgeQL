import type { ExecutionContext, Environment } from '../types'
import { GraphQLContext } from './graphql'
import { HttpContext } from './http'
import { RuntimeContext } from './runtime'

export class Context {
  public readonly runtime: RuntimeContext
  public readonly http: HttpContext
  public readonly graphql: GraphQLContext

  constructor(request: Request, env?: Environment, exeContext?: ExecutionContext) {
    this.runtime = new RuntimeContext(env, exeContext)
    this.http = new HttpContext(request)
    this.graphql = new GraphQLContext()
  }

  json(): Response {
    return this.http.toJSON()
  }
}
