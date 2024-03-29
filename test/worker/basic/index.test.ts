import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { unstable_dev } from 'wrangler'
import type { UnstableDevWorker } from 'wrangler'

describe('Worker', () => {
	let worker: UnstableDevWorker

	beforeAll(async () => {
		worker = await unstable_dev('./index.ts', {
			ip: '127.0.0.1',
			local: true,
			experimental: { disableExperimentalWarning: true },
		})
	})

	afterAll(async () => {
		await worker.stop()
	})

	it('should return user with id and name', async () => {
		const req = {
			query: `
query H($id: Int!) {
	user(id: $id) {
		id
		name
	}
}
`,
			variables: { id: 1 },
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
			expect(resp.headers.get('x-power-by')).toBe('EdgeQL')
			expect(resp.headers.get('x-response-time')).toBeDefined()
			expect(parseInt(resp.headers.get('x-response-time') ?? '0')).toBeGreaterThan(0)
			const data = await resp.json()
			expect(data).toEqual({
				data: {
					user: {
						id: 1,
						name: 'EdgeQL',
					},
				},
			})
		}
	})

	it('should return post with id and name', async () => {
		const req = {
			query: `
query H($id: Int!) {
	post(id: $id) {
		id
		name
	}
}
`,
			variables: { id: Math.floor(Math.random() * 100) },
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
			expect(resp.headers.get('x-power-by')).toBe('EdgeQL')
			expect(resp.headers.get('x-response-time')).toBeDefined()
			const data = await resp.json()
			expect(data).toEqual({
				data: {
					post: {
						id: req.variables.id,
						name: 'Gone with Wind',
					},
				},
			})
		}
	})
})
