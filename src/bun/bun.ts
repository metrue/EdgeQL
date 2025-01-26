import { EdgeQL } from '../'

export class BunEdgeQL extends EdgeQL {
  listen({ port, hostname }: { port?: number; hostname?: string }): void {
    Bun.serve({
      port: port ?? 3000,
      hostname: hostname ?? '0.0.0.0',
      fetch: this.fetch,
    })
  }
}

const app = new BunEdgeQL()
app.handle(
  `
type Query {
  hello: String
}
`,
  (ctx) => {
    return `hello from EdgeQL on ${ctx.runtime.runtime}`
  }
)

app.listen({ port: 3000 })
