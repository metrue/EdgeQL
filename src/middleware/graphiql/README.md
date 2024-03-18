#  EdgeQL GraphiQL middleware

```typescript

import type { Context } from 'edgeql'
import { cors } from 'edgeql/cors'
import { graphiql } from 'edgeql/graphiql'
import { NodeEdgeQL } from 'edgeql/node'

const app = new NodeEdgeQL()

app.handle(`
  type Query {
    hello: String!
  }
  `, (ctx: Context) => {
    return `hello world`
  }
)

app.use(graphiql({path: '/playground'}))

```
