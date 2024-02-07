# Hollo World

```
yarn create cloudflare
```

then add 'EdgeQL',

```
yarn add edgeql graphql
```

update your the source code in `src/index.ts` to be following

```typescript
import { EdgeQL } from 'edgeql'
import type { Context } from 'edgeql'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

const app = new EdgeQL()

const queryType = new GraphQLObjectType({
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

app.register({
	schema: new GraphQLSchema({
		query: queryType,
	})
})

export default app
```

then deploy your worker

```
yarn deploy
```

after a successful deployment, you should see output like this

```
$ yarn deploy
yarn run v1.22.19
$ wrangler deploy
Proxy environment variables detected. We'll use your proxy for fetch requests.
 ⛅️ wrangler 3.26.0 (update available 3.27.0)
-------------------------------------------------------
Total Upload: 423.57 KiB / gzip: 74.89 KiB
Uploaded helloworld (4.08 sec)
Published helloworld (1.42 sec)
  https://helloworld.xxxxx.workers.dev
Current Deployment ID: 3f014a03-5f6c-4419-accb-aab85229a33a
✨  Done in 15.72s.
```

then you can test your worker GraphQL endpoint with `curl`.

```
curl -X POST --data '{"query": "query { helloworld }" }' -H 'Content-Type: application/json'  https://helloworld.minghe.workers.dev

{"data":{"helloworld":"helloworld, EdgeQL"}}
```

To learn more about EdgeQL like how to use middleware, you can go to [documentation](https://github.com/metrue/edgeql)
