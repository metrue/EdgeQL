import { describe, expect, it } from 'vitest'
import { EdgeQL } from '../../'
import { graphiql } from '.'

describe('GraphiQL', () => {
  it('should load GraphiQL when access the path', async () => {
    const app = new EdgeQL()
    app.use(graphiql({ path: '/playground' }))
    const endpoint = 'http://localhost'
    const req = new Request(endpoint + '/playground')
    const res = await app.fetch(req)
    expect(res.statusText).toEqual('')
    expect(res.status).toBe(200)
    expect(await res.text()).toEqual(`
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }

      #graphiql {
        height: 100vh;
      }
    </style>
    <script
      crossorigin
      src="https://unpkg.com/react@18/umd/react.development.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"
    ></script>
    <script
      src="https://unpkg.com/graphiql/graphiql.min.js"
      type="application/javascript"
    ></script>
    <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
    <script
      src="https://unpkg.com/@graphiql/plugin-explorer/dist/index.umd.js"
      crossorigin
    ></script>

    <link
      rel="stylesheet"
      href="https://unpkg.com/@graphiql/plugin-explorer/dist/style.css"
    />
  </head>

  <body>
    <div id="graphiql">Loading...</div>
    <script>
      const root = ReactDOM.createRoot(document.getElementById('graphiql'));
      const fetcher = GraphiQL.createFetcher({
        url: '${endpoint}',
        headers: { 'X-Example-Header': 'foo' },
      });
      const explorerPlugin = GraphiQLPluginExplorer.explorerPlugin();
      root.render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true,
          plugins: [explorerPlugin],
        }),
      );
    </script>
  </body>
</html>
      `)
  })
})
