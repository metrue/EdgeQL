import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { unstable_dev } from 'wrangler'
import type { UnstableDevWorker } from 'wrangler'

// TODO enable this
describe.skip('Worker', () => {
	let worker: UnstableDevWorker

	beforeAll(async () => {
		worker = await unstable_dev('src/index.ts', {
			experimental: { disableExperimentalWarning: true },
		})
	})

	afterAll(async () => {
		await worker.stop()
	})

	it('should return Hello World', async () => {
		const req = {
			query: `
query H($name: String) {
	hello(name: $name)
}
`,
			variables: { name: 'Yo' },
			operationName: 'H',
		}
		const resp = await worker.fetch('http://localhost', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req),
		})
		if (resp) {
			const data = await resp.json()
			expect(data).toEqual({
				data: {
					hello: 'hello, Yo',
				},
			})
		}
	})
})
