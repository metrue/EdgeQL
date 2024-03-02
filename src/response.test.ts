import { describe, expect, it } from 'vitest'
import { Res } from './response'

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Array<any> = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  return buffer.toString('utf-8')
}

describe('request', () => {
  it('new', async () => {
    const res = new Res()
    res.status = 200
    res.statusText = 'OK'
    res.headers.set('x-header', 'value')
    res.body = { data: { hello: 'world' } }
    const r = res.toJSON()
    expect(r).to.instanceof(Response)
    expect(r.statusText).toBe(res.statusText)
    expect(r.status).toBe(res.status)
    expect(r.headers).toEqual(res.headers)
    expect(r.body).not.toBeNull()
    expect(await streamToString(r.body as any)).toEqual(JSON.stringify(res.body))
  })
})
