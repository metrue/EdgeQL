import type { GraphQLSchema, ExecutionResult, DocumentNode } from 'graphql'
import { parse, Source } from 'graphql'
import type { ExecutionContext, Environment, GraphQLRequest } from './types'

export class Context {
  public readonly request: Request
  public readonly env: Environment
  public readonly ctx: ExecutionContext

  private _schema?: GraphQLSchema
  private _query?: string
  private _operationName?: string
  private _variables?: Record<string, unknown>
  private _document: DocumentNode | undefined

  constructor(request: Request, env: Environment, ctx: ExecutionContext, schema?: GraphQLSchema) {
    this.request = request
    this.env = env
    this.ctx = ctx

    this._schema = schema
  }

  get variables(): Record<string, unknown> | undefined {
    return this._variables
  }

  get operationName(): string | undefined {
    return this._operationName
  }

  get schema(): GraphQLSchema | undefined {
    return this._schema
  }

  get query(): string | undefined {
    return this._query
  }

  get document(): DocumentNode | undefined {
    return this._document
  }

  async process() {
    const contentType = this.request.headers.get('content-type')

    switch (contentType) {
      case 'application/graphql':
        this._query = await this.request.text()
        break
      case 'application/json': {
        const { query, operationName, variables /* extensions  */ } =
          (await this.request.json()) as GraphQLRequest
        this._query = query
        this._operationName = operationName
        this._variables = variables
        break
      }
      case 'application/x-www-form-urlencoded': {
        const text = await this.request.text()
        const searchParams = new URLSearchParams(text)
        searchParams.forEach((v, k) => {
          if (k === 'query') {
            this._query = v
          } else if (k === 'variables') {
            this._variables = JSON.parse(v)
          } else if (k === 'operationName') {
            this._operationName = v
          }
        })
        break
      }
    }

    if (this._query) {
      this._document = parse(new Source(this._query, 'GraphQL request'))
    }
  }

  json(body: ExecutionResult | string, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
      status: 200,
      ...init,
    })
  }
}
