import type { Context } from './context'

export type Next = () => Promise<void>

export type Middleware = (ctx: Context, next: Next) => Promise<void | undefined>

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

export type Environment = Record<string, any>
