import type { Middleware } from '../../types'
import { Jwt } from '../../utils/jwt'
import type { AlgorithmTypes } from '../../utils/jwt/types'

export const jwt = (options: { secret: string; alg?: string }): Middleware => {
  if (!options) {
    throw new Error('JWT auth middleware requires options for "secret')
  }

  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error('`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.')
  }

  return async (ctx, next) => {
    const credentials = ctx.request.headers.get('Authorization')
    let token
    if (credentials) {
      const parts = credentials.split(/\s+/)
      if (parts.length !== 2) {
        ctx.res.status = 401
        ctx.res.statusText = 'Unauthorized'
        ctx.res.headers.set(
          'WWW-Authenticate',
          `Bearer realm="${ctx.request.url}",error="invalid_request",error_description="invalid credentials structure"`
        )
        return
      } else {
        token = parts[1]
      }
    }

    if (!token) {
      ctx.res.status = 401
      ctx.res.statusText = 'Unauthorized'
      ctx.res.headers.set(
        'WWW-Authenticate',
        `Bearer realm="${ctx.request.url}",error="invalid_request",error_description="no authorization included in request"`
      )
      return
    }

    let authorized = false
    let msg = ''
    try {
      authorized = await Jwt.verify(token, options.secret, options.alg as AlgorithmTypes)
    } catch (e) {
      msg = `${e}`
    }
    if (!authorized) {
      ctx.res.status = 401
      ctx.res.statusText = msg
      ctx.res.headers.set(
        'WWW-Authenticate',
        `Bearer realm="${ctx.request.url}",error="invalid_token",error_description="token verification failure"`
      )
      return
    }

    await next()
  }
}
