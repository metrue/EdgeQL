import type { Context, Next } from '../../index'

export const wallclock = async (ctx: Context, next: Next) => {
  const startedAt = new Date()
  await next()
  const endedAt = new Date()
  ctx.res.headers.set('x-edgeql-wallclock', `${endedAt.getTime() - startedAt.getTime()}`)
}
