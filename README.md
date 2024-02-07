# EdgeQL

Bringing GraphQL to the Edge with effortless lightness.

```typescript
import { EdgeQL } from 'buble'
import type { Context } from 'buble'
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

// register schema
app.register({
	schema: helloworld,
})

app.register({ 
  schema: clock,
})

// middleware
app.use(async (ctx: Context, next: Next) => {
  const startedAt = new Date()
  await next()
  const endedAt = new Date()
  ctx.res.headers.set('x-response-time', `${endedAt.getTime() - startedAt.getTime()}`)
})

export default app
```

### examples

* [Cloudflare Worker](https://github.com/metrue/EdgeQL/tree/master/examples/cloudflare/helloworld)
* Vercel Edge Function: TBD
