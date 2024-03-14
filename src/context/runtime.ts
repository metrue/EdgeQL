import type { ExecutionContext, Environment } from '../types'

type Runtime = 'node' | 'deno' | 'bun' | 'cloudflare' | 'fastly' | 'vercel' | 'lagon' | 'unknown'

export class RuntimeContext {
  public readonly env?: Environment
  public readonly exeContext?: ExecutionContext

  constructor(env?: Environment, exeContext?: ExecutionContext) {
    this.env = env
    this.exeContext = exeContext
  }

  get runtime(): Runtime {
    const global = globalThis as any

    if (global?.Deno !== undefined) {
      return 'deno'
    }

    if (global?.Bun !== undefined) {
      return 'bun'
    }

    if (typeof global?.WebSocketPair === 'function') {
      return 'cloudflare'
    }

    if (global?.fastly !== undefined) {
      return 'fastly'
    }

    if (typeof global?.EdgeRuntime === 'string') {
      return 'vercel'
    }

    if (global?.process?.release?.name === 'node') {
      return 'node'
    }

    if (global?.__lagon__ !== undefined) {
      return 'lagon'
    }

    return 'unknown'
  }
}
