import {
  GraphQLSchema,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql'
import { Yo } from '../../../src'
import type { Context, Next } from '../../../src'
import process from 'process'

const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLString },
  },
})

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: userType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent: any, args: any, ctx: Context, info: any) => {
        console.warn(parent, args)
        const { id } = args
        return {
          id,
          name: 'Yo',
        }
      },
    },
    root: {
      type: userType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent: any, args: any, ctx: Context, info: any) => {
        console.warn(parent, args)
        const { id } = args
        return {
          id,
          name: 'root',
        }
      },
    },
  },
})

const schema = new GraphQLSchema({
  query: queryType,
})

const app = new Yo()
app.register({ schema })

app.use(async (ctx: Context, next: Next) => {
  const startedAt = new Date()
  await next()
  const endedAt = new Date()
  ctx.res.headers['x-response-time'] = `${endedAt.getTime() - startedAt.getTime()}`
})

app.use(async (ctx: Context, next: Next) => {
  ctx.res.headers['x-power-by'] = 'Yo'
  await next()
})

export default app
