import type { DocumentNode } from 'graphql'
import { parse } from 'graphql'
import type { GraphQLRequest } from './types'

export class Req {
  readonly request: Request

  private _query: string | undefined
  private _operationName?: string
  private _variables: Record<string, unknown> | undefined
  private _extensions: Record<string, unknown> | undefined
  private _document: DocumentNode | undefined

  constructor(request: Request) {
    this.request = request
  }

  static async from(request: Request) {
    const req = new Req(request)

    const contentType = request.headers.get('content-type')
    switch (contentType) {
      case 'application/graphql': {
        const query = await request.text()
        req.query = query
        break
      }
      case 'application/json': {
        const { query, operationName, variables, extensions } =
          (await request.json()) as GraphQLRequest

        req.query = query
        req.variables = variables
        req.operationName = operationName
        req.extensions = extensions
        break
      }
      case 'application/x-www-form-urlencoded': {
        const text = await request.text()
        const searchParams = new URLSearchParams(text)
        searchParams.forEach((v, k) => {
          if (k === 'query') {
            req.query = v
          } else if (k === 'variables') {
            req.variables = JSON.parse(v)
          } else if (k === 'operationName') {
            req.operationName = v
          }
        })
        break
      }
    }

    if (req.query) {
      req.document = parse(req.query)
    }

    return req
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

  set document(document: DocumentNode | undefined) {
    this._document = document
  }

  get document() {
    return this._document
  }
}
