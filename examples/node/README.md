# edgeql-on-node-example

EdgeQL works on Node out of box.

### JavaScript

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

### TypeScript

```typescript
import type { Context } from 'edgeql'
import { NodeEdgeQL } from 'edgeql/node'

const app = new NodeEdgeQL()

app.handle(`
type Query {
  hello: String
}
`, (ctx: Context) => {
  return  `hello from EdgeQL on ${ctx.runtime.runtime}`
})

app.listen({port: 4000}, ({address, family, port}) => {
  console.log(address, family, port)
})
```
