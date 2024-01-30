import Yo from './core/yo'
import { GraphQLSchema, buildSchema } from 'graphql'
import SchemaBuilder from '@pothos/core';

import { ExecutionContext, Environment } from './types';

const builder = new SchemaBuilder({});
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
});

const app = new Yo()
app.register({
  schema: builder.toSchema()
})

export default app
