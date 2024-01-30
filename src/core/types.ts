export interface GraphQLRequest<TVariables extends VariableValues = VariableValues> {
  query?: string
  operationName?: string
  variables?: TVariables
  extensions?: Record<string, any>
}

export type VariableValues = { [name: string]: any }

export interface ExecutionContext {
  waitUntil(promise: Promise<void>): void
  passThroughOnException(): void
}

export type Bindings = Record<string, any> // For Cloudflare Workers
export type Variables = Record<string, any> // For c.set/c.get functions
export type Environment = {
  Bindings: Bindings
  Variables: Variables
}
