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
