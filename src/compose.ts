import type { Context } from './context/context'
import type { Middleware, Next } from './types'

export function compose(middleware: Middleware[]) {
  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!')
    }
  }

  return (context: Context, next?: Next) => {
    // last called middleware #
    let index = -1
    return dispatch(0)

    function dispatch(i: number): Promise<void> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'))
      }

      index = i
      let fn: Middleware = middleware[i]

      if (i === middleware.length && next) {
        fn = next
      }

      if (!fn) {
        return Promise.resolve()
      }

      try {
        const ctx = fn(context, async () => {
          await dispatch(i + 1)
        })
        return Promise.resolve(ctx)
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
