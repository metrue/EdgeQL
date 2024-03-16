# EdgeQL

Effortlessly craft GraphQL APIs on the Edge, designed to thrive across various JavaScript runtimes.

| Runtime       | Status        |  Example      |
| ------------- | ------------- | ------------- |
| Cloudflare Workers     | :white_check_mark:  | [cloudflare](examples/cloudflare)  |
| Node                  | :white_check_mark:  | [node](examples/node)               |
| Bun                   | :white_check_mark:  | [Bun](examples/bun)                 |
| Deno                  | :white_large_square: Pending     |                        |
| Vercel                | :white_large_square: Pending     |                        |

## EdgeQL on JavaScript Runtimes

### Node

```javascript
import { NodeEdgeQL } from 'edgeql/node'

const app = new NodeEdgeQL()

app.handle(`
type Query {
  hello: String
}
`, (ctx) => {
  return  `hello from EdgeQL on ${ctx.runtime.runtime}`
})

app.listen({port: 4000}, ({address, family, port}) => {
  console.log(address, family, port)
})
```

### Bun

```typescript
import { EdgeQL } from 'edgeql'
import type {  Context } from 'edgeql'

const app = new EdgeQL()

app.handle(`
type Query {
  hello: String
}
`, (_ctx: Context) => {
  return  'hello from EdgeQL on Bun'
})

const port =  Bun.env['PORT'] ? parseInt(Bun.env['PORT']) : 3000
console.log(`Running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch
}
```

### Cloudflare Workers

```typescript
import { EdgeQL } from 'edgeql'
import type { Context } from 'edgeql'

const app = new EdgeQL()

app.handle(
`
type Query {
  whereami: String
}
`,
(ctx: Context) => {
  return `EdgeQL is running on ${ctx.runtime.runtime}`
})
```


## Schema Design Approaches

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

## Middlewares

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
* [CORS](src/middleware/cors)
* [wallclock](src/middleware/wallclock)
