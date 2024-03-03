import type { DocumentNode, GraphQLSchema } from 'graphql'
import { parse } from 'graphql'

type VariableValues = { [name: string]: any }

export interface GraphQLRequest<TVariables extends VariableValues = VariableValues> {
  query?: string
  operationName?: string
  variables?: TVariables
  extensions?: Record<string, any>
}

export class GraphQLContext {
  private _query: string | undefined
  private _operationName?: string
  private _variables: Record<string, unknown> | undefined
  private _extensions: Record<string, unknown> | undefined

  private _parents: any
  private _args: any
  private _info: any

  private _document: DocumentNode | undefined
  private _schema: GraphQLSchema | undefined

  async init(request: Request) {
    const contentType = request.headers.get('content-type')
    switch (contentType) {
      case 'application/graphql': {
        const query = await request.text()
        this.query = query
        break
      }
      case 'application/json': {
        const { query, operationName, variables, extensions } =
          (await request.json()) as GraphQLRequest

        this.query = query
        this.variables = variables
        this.operationName = operationName
        this.extensions = extensions
        break
      }
      case 'application/x-www-form-urlencoded': {
        const text = await request.text()
        const searchParams = new URLSearchParams(text)
        searchParams.forEach((v, k) => {
          if (k === 'query') {
            this.query = v
          } else if (k === 'variables') {
            this.variables = JSON.parse(v)
          } else if (k === 'operationName') {
            this.operationName = v
          }
        })
        break
      }
    }

    if (this.query) {
      this.document = parse(this.query)
    }
  }

  set query(query: string | undefined) {
    this._query = query
  }

  get query() {
    return this._query
  }

  set operationName(operationName: string | undefined) {
    this._operationName = operationName
  }

  get operationName() {
    return this._operationName
  }

  set variables(variables: Record<string, unknown> | undefined) {
    this._variables = variables
  }

  get variables() {
    return this._variables
  }

  set extensions(extensions: Record<string, unknown> | undefined) {
    this._extensions = extensions
  }

  get extensions() {
    return this._extensions
  }

  set parents(value: any) {
    this._parents = value
  }

  get parents() {
    return this._parents
  }

  set args(value: any) {
    this._args = value
  }

  get args() {
    return this._args
  }

  set info(value: any) {
    this._info = value
  }

  get info() {
    return this._info
  }

  set document(document: DocumentNode | undefined) {
    this._document = document
  }

  get document() {
    return this._document
  }

  get schema(): GraphQLSchema | undefined {
    return this._schema
  }

  set schema(schema: GraphQLSchema | undefined) {
    this._schema = schema
  }
}
