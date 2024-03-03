import type { Context } from './context/context'

export type Next = () => Promise<void>

export type Handler = (ctx: Context) => Promise<any> | any
export type Middleware = (ctx: Context, next: Next) => Promise<void | undefined>

export type VariableValues = { [name: string]: any }

export interface ExecutionContext {
  waitUntil(promise: Promise<void>): void
  passThroughOnException(): void
}

export type Environment = Record<string, any>
