import { describe, expect, it } from 'vitest'
import { compose } from './compose'
import type { Context } from './context'
import type { Next, Middleware } from './types'

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1))
}

function isPromise(x: any) {
  return x && typeof x.then === 'function'
}

describe('Compose', () => {
  it('should work', async () => {
    const arr: number[] = []
    const stack = []

    stack.push(async (context: Context, next: Next) => {
      arr.push(1)
      await wait(1)
      await next()
      await wait(1)
      arr.push(6)
    })

    stack.push(async (context: Context, next: Next) => {
      arr.push(2)
      await wait(1)
      await next()
      await wait(1)
      arr.push(5)
    })

    stack.push(async (context: Context, next: Next) => {
      arr.push(3)
      await wait(1)
      await next()
      await wait(1)
      arr.push(4)
    })

    await compose(stack)({} as any, async () => {})
    expect(arr).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]))
  })

  it('should be able to be called twice', () => {
    const stack = []

    stack.push(async (context: Context, next: Next) => {
      ;(context as any).arr.push(1)
      await wait(1)
      await next()
      await wait(1)
      ;(context as any).arr.push(6)
    })

    stack.push(async (context: Context, next: Next) => {
      ;(context as any).arr.push(2)
      await wait(1)
      await next()
      await wait(1)
      ;(context as any).arr.push(5)
    })

    stack.push(async (context: Context, next: Next) => {
      ;(context as any).arr.push(3)
      await wait(1)
      await next()
      await wait(1)
      ;(context as any).arr.push(4)
    })

    const fn = compose(stack)
    const ctx1 = { arr: [] }
    const ctx2 = { arr: [] }
    const out = [1, 2, 3, 4, 5, 6]

    return fn(ctx1 as unknown as Context)
      .then(() => {
        expect(out).toEqual(ctx1.arr)
        return fn(ctx2 as unknown as Context)
      })
      .then(() => {
        expect(out).toEqual(ctx2.arr)
      })
  })

  it('should create next functions that return a Promise', function () {
    const stack: Middleware[] = []
    const arr: any[] = []
    for (let i = 0; i < 5; i++) {
      stack.push(async (context: Context, next: Next) => {
        arr.push(next())
      })
    }

    compose(stack)({} as Context)

    for (const next of arr) {
      expect(isPromise(next)).toBeTruthy
    }
  })

  it('should work with 0 middleware', function () {
    return compose([])({} as unknown as Context)
  })

  it('should work when yielding at the end of the stack', async () => {
    const stack = []
    let called = false

    stack.push(async (ctx: Context, next: Next) => {
      await next()
      called = true
    })

    await compose(stack)({} as unknown as Context)
    expect(called).toBeTruthy()
  })

  it('should reject on errors in middleware', () => {
    const stack = []

    stack.push(() => {
      throw new Error()
    })

    return compose(stack)({} as any).then(
      () => {
        throw new Error('promise was not rejected')
      },
      (e) => {
        expect(e).toBeInstanceOf(Error)
      }
    )
  })

  it('should keep the context', () => {
    const ctx = {}

    const stack = []

    stack.push(async (ctx2: Context, next: Next) => {
      await next()
      expect(ctx2).toEqual(ctx)
    })

    stack.push(async (ctx2: Context, next: Next) => {
      await next()
      expect(ctx2).toEqual(ctx)
    })

    stack.push(async (ctx2: Context, next: Next) => {
      await next()
      expect(ctx2).toEqual(ctx)
    })

    return compose(stack)(ctx as Context)
  })

  it('should catch downstream errors', async () => {
    const arr: number[] = []
    const stack = []

    stack.push(async (ctx: Context, next: Next) => {
      arr.push(1)
      try {
        arr.push(6)
        await next()
        arr.push(7)
      } catch (err) {
        arr.push(2)
      }
      arr.push(3)
    })

    stack.push(async (ctx: Context, next: Next) => {
      arr.push(4)
      throw new Error()
    })

    await compose(stack)({} as unknown as Context)
    expect(arr).toEqual([1, 6, 4, 2, 3])
  })

  it('should compose w/ next', () => {
    let called = false

    return compose([])({} as Context, async () => {
      called = true
    }).then(function () {
      expect(called).toBeTruthy()
    })
  })

  it('should handle errors in wrapped non-async functions', () => {
    const stack = []

    stack.push(function () {
      throw new Error()
    })

    return compose(stack)({} as unknown as Context).then(
      () => {
        throw new Error('promise was not rejected')
      },
      (e) => {
        expect(e).toBeInstanceOf(Error)
      }
    )
  })

  // https://github.com/koajs/compose/pull/27#issuecomment-143109739
  it('should compose w/ other compositions', () => {
    const called: number[] = []

    return compose([
      compose([
        (ctx: Context, next: Next) => {
          called.push(1)
          return next()
        },
        (ctx: Context, next: Next) => {
          called.push(2)
          return next()
        },
      ]),
      (ctx: Context, next: Next) => {
        called.push(3)
        return next()
      },
    ])({} as unknown as Context).then(() => expect(called).toEqual([1, 2, 3]))
  })

  it('should throw if next() is called multiple times', () => {
    return compose([
      async (ctx: Context, next: Next) => {
        await next()
        await next()
      },
    ])({} as unknown as Context).then(
      () => {
        throw new Error('boom')
      },
      (err) => {
        expect(/multiple times/.test(err.message)).toBeTruthy()
      }
    )
  })

  it('should return a valid middleware', () => {
    let val = 0
    return compose([
      compose([
        (ctx: Context, next: Next) => {
          val++
          return next()
        },
        (ctx: Context, next: Next) => {
          val++
          return next()
        },
      ]),
      (ctx: Context, next: Next) => {
        val++
        return next()
      },
    ])({} as unknown as Context).then(function () {
      expect(val).toEqual(3)
    })
  })

  // TODO fix this test
  it.skip('should return last return value', () => {
    const stack = []

    stack.push(async (context: Context, next: Next) => {
      const val = await next()
      expect(val).toEqual(2)
      return 1
    })

    stack.push(async (context: Context, next: Next) => {
      const val = await next()
      expect(val).toEqual(0)
      return 2
    })

    const next = () => 0
    return compose(stack as any)({} as any, next as any).then(function (val) {
      expect(val).toEqual(1)
    })
  })

  it('should not affect the original middleware array', () => {
    const middleware = []
    const fn1 = (ctx: Context, next: Next) => {
      return next()
    }
    middleware.push(fn1)

    for (const fn of middleware) {
      expect(fn).toEqual(fn1)
    }

    compose(middleware)

    for (const fn of middleware) {
      expect(fn).toEqual(fn1)
    }
  })
})
