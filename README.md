# EdgeQL

Effortlessly craft GraphQL APIs on the Edge.

## Quick Start

EdgeQL supports both Schema-First and Code-First.

* Schema First

```typescript
import { EdgeQL } from 'edgeql'

const app = new EdgeQL()
const schema = `
type Query {
  hello: String
}
    `
app.handle(schema, (ctx: Context) => 'world')

export default app
```

* Code First

```typescript
import { EdgeQL } from 'edgeql'
import type { Context } from 'edgeql'
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

app.handle(helloworld)

export default app
```

### Middlewares

EdgeQL adopts the same middleware style like Koa, middleware are simple functions which return a `MiddlewareFunction` with signature (ctx, next). When the middleware is run, it must manually invoke `next()` to run the "downstream" middleware.

For example if you wanted to track how long it takes for a request to propagate through EdgeQL by adding an `X-Response-Time` header field the middleware would look like the following:

```typescript
async function responseTime(ctx: Context, next: Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
}

app.use(responseTime);
```

The builtin middlewares are,

* [JWT](src/middleware/jwt)
* [wallclock](src/middleware/wallclock)

### examples

* [Cloudflare Worker](https://github.com/metrue/EdgeQL/tree/master/examples/cloudflare/helloworld)
* Vercel Edge Function: TBD
