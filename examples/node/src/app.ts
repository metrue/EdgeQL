import type { Context } from 'edgeql'
import { cors } from 'edgeql/cors'
import { NodeEdgeQL } from 'edgeql/node'

const app = new NodeEdgeQL()

app.handle(`
type Query {
  hello: String
}
`, (ctx: Context) => {
  return  `hello from EdgeQL on ${ctx.runtime.runtime}`
})

app.use(cors())

app.listen({port: 4000}, ({address, family, port}) => {
  console.log(address, family, port)
})
