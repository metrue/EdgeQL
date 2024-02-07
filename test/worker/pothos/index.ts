import SchemaBuilder from '@pothos/core'
import { EdgeQL } from './edgeql'

const builder = new SchemaBuilder({})
builder.queryType({
  fields: (t) => ({
    hello: t.string({
      nullable: false,
      args: {
        name: t.arg({
          type: 'String',
          required: true,
        }),
      },
      resolve: (parent, { name }) => `hello, ${name || 'World'}`,
    }),
  }),
})

const app = new EdgeQL()
app.register({
  schema: builder.toSchema(),
})

export default app
