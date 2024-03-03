import type { ExecutionContext, Environment } from '../types'

export class RuntimeContext {
  public readonly env?: Environment
  public readonly exeContext?: ExecutionContext

  constructor(env?: Environment, exeContext?: ExecutionContext) {
    this.env = env
    this.exeContext = exeContext
  }
}
