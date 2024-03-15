import { serve } from '@hono/node-server'
import { EdgeQL } from '../'

export class NodeEdgeQL extends EdgeQL {
  // TODO support http2
  listen(
    { port, hostname }: { port?: number; hostname?: string },
    listener?: (info: { address: string; family: string; port: number }) => void
  ): void {
    serve(
      {
        fetch: this.fetch,
        port: port ?? 3000,
        hostname: hostname ?? '0.0.0.0',
      },
      listener
    )
  }
}
