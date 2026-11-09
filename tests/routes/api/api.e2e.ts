import { expect, test } from '@playwright/test';

test('health answers only ok', async ({ request }) => {
	const response = await request.get('/api/health');
	expect(response.status()).toBe(200);
	expect(await response.text()).toBe('ok');
});

test('an unknown versioned endpoint returns a JSON ErrorBody', async ({ request }) => {
	const response = await request.post('/api/v1/does-not-exist', { data: {} });
	expect(response.status()).toBe(404);
	expect(await response.json()).toMatchObject({
		code: 'NOT_FOUND',
		messageKey: 'common_error_not_found'
	});
	expect(response.headers()['x-request-id']).toBeTruthy();
});

test('metrics are hidden without the token', async ({ request }) => {
	expect((await request.get('/api/metrics')).status()).toBe(404);
});
