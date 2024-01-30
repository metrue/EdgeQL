import type { GraphQLSchema, ExecutionResult, DocumentNode } from 'graphql'
import { parse } from 'graphql'
import type { ExecutionContext, Environment, GraphQLRequest } from './types'

export class Context {
  public readonly request: Request
  public readonly env: Environment
  public readonly ctx: ExecutionContext

  private _schema: GraphQLSchema | undefined
  private _query: string | undefined
  private _operationName?: string
  private _variables: Record<string, unknown> | undefined
  private _document: DocumentNode | undefined

  constructor(
    request: Request,
    env: Environment,
    ctx: ExecutionContext,
  ) {
    this.request = request
    this.env = env
    this.ctx = ctx
  }

  static async from(
    request: Request,
    env: Environment,
    exeContext: ExecutionContext,
    schema?: GraphQLSchema
  ): Promise<Context> {
    const ctx = new Context(request, env, exeContext)

    ctx.schema = schema

    const contentType = request.headers.get('content-type')
    switch (contentType) {
      case 'application/graphql': {
        const query = await request.text()
        ctx.query = query
        break
      }
      case 'application/json': {
        const { query, operationName, variables /* extensions  */ } =
          (await request.json()) as GraphQLRequest
  
        ctx.query = query 
        ctx.variables = variables
        ctx.operationName = operationName
        break
      }
      case 'application/x-www-form-urlencoded': {
        const text = await request.text()
        const searchParams = new URLSearchParams(text)
        searchParams.forEach((v, k) => {
          if (k === 'query') {
            ctx.query = v
          } else if (k === 'variables') {
            ctx.variables = JSON.parse(v)
          } else if (k === 'operationName') {
            ctx.operationName = v
          }
        })
        break
      }
    }

    if (ctx.query) {
      ctx.document = parse(ctx.query)
    }

    return ctx
  }

  get variables(): Record<string, unknown> | undefined {
    return this._variables
  }

  set variables(variables: Record<string, unknown> | undefined) {
    this._variables = variables
  }

  get operationName(): string | undefined {
    return this._operationName
  }

  set operationName(operationName: string | undefined) {
    this._operationName = operationName
  }

  get schema(): GraphQLSchema | undefined {
    return this._schema
  }

  set schema(schema: GraphQLSchema | undefined) {
    this._schema = schema
  }

  get query(): string | undefined {
    return this._query
  }

  set query(query: string | undefined) {
    this._query = query
  }

  get document(): DocumentNode | undefined {
    return this._document
  }

  set document(document: DocumentNode | undefined) {
    this._document = document
  }

  json(body: ExecutionResult | string, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
      status: 200,
      ...init,
    })
  }
}
