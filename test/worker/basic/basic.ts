import {
  GraphQLSchema,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql'
import { Buble } from '../../../src'
import type { Context, Next } from '../../../src'

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
          name: 'Buble',
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

const postType = new GraphQLObjectType({
  name: 'Post',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLString },
  },
})

const postsQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    post: {
      type: postType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent: any, args: any, ctx: Context, info: any) => {
        const { id } = args
        return {
          id,
          name: 'Gone with Wind',
        }
      },
    },
  },
})

const app = new Buble()
app.register({
  schema: new GraphQLSchema({
    query: queryType,
  }),
})
app.register({
  schema: new GraphQLSchema({
    query: postsQuery,
  }),
})

app.use(async (ctx: Context, next: Next) => {
  const startedAt = new Date()
  await next()
  const endedAt = new Date()
  ctx.res.headers.set('x-response-time', `${endedAt.getTime() - startedAt.getTime()}`)
})

app.use(async (ctx: Context, next: Next) => {
  ctx.res.headers.set('x-power-by', 'Buble')
  await next()
})

export default app
