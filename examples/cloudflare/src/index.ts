import { EdgeQL } from 'edgeql'
import type { Context } from 'edgeql'
import { graphiql } from 'edgeql/graphiql'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

const app = new EdgeQL()

const helloworld: GraphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      helloworld: {
        type: GraphQLString,
        resolve: (parent: any, args: any, ctx: Context, info: any) => {
          return 'helloworld, EdgeQL'
        },
      },
    },
  })
})

const clock: GraphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      clock: {
        type: GraphQLString,
        resolve: (parent: any, args: any, ctx: Context, info: any) => {
          return new Date().toISOString()
        },
      },
    },
  })
})

app.handle(
`
type Query {
  whereami: String
}
`,
(ctx: Context) => {
  return `EdgeQL is running on ${ctx.runtime.runtime}`
})

app.handle(helloworld)
app.handle(clock)
app.use(graphiql())

export default app
