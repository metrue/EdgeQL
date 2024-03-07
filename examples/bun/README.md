# edgeql-on-bun-example

Bun implements a lot of Web-standard APIs, EdgeQL works on Bun out of box.

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

## Usage

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run app.ts
```
