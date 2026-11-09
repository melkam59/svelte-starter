import { expect, test } from '@playwright/test';

test('the sign-in endpoint of the auth library is closed, so nobody can skip the lockout', async ({
	request
}) => {
	const response = await request.post('/api/auth/sign-in/email', {
		data: { email: 'owner@demo.com', password: '12345678' }
	});

	expect(response.status()).toBe(404);
	expect(response.headers()['set-cookie']).toBeUndefined();
});

test('a wrong password shows one message that does not reveal whether the email exists', async ({
	page,
	context
}) => {
	await context.addCookies([{ name: 'language', value: 'en', url: 'http://localhost:4173' }]);
	await page.goto('/sign-in');
	await page.locator('#email').fill('nobody@demo.com');
	await page.locator('#password').fill('wrong-password');
	await page.locator('button[type="submit"]').click();

	await expect(page.getByText("That email and password don't match")).toBeVisible();
});

test('the sign-in screen speaks Amharic on a device set to Amharic', async ({ page, context }) => {
	await context.addCookies([{ name: 'language', value: 'am', url: 'http://localhost:4173' }]);
	await page.goto('/sign-in');

	await expect(page).toHaveTitle('ግባ');
	await expect(page.getByRole('heading', { level: 1, name: 'ግባ' })).toBeVisible();
	await expect(page.getByLabel('ኢሜይል')).toBeVisible();
	await expect(page.getByLabel('የይለፍ ቃል', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'የይለፍ ቃሉን አሳይ' })).toBeVisible();

	await page.getByLabel('ኢሜይል').fill('nobody@demo.com');
	await page.getByLabel('የይለፍ ቃል', { exact: true }).fill('wrong-password');
	await page.getByRole('button', { name: 'ግባ', exact: true }).click();
	await expect(page.getByRole('alert')).toContainText('ኢሜይሉና የይለፍ ቃሉ አይዛመዱም');
});

test('with no language chosen yet, the app speaks Amharic', async ({ page }) => {
	await page.goto('/sign-in');

	await expect(page.locator('html')).toHaveAttribute('lang', 'am');
	await expect(page.getByRole('heading', { level: 1, name: 'ግባ' })).toBeVisible();
});

test('a language cookie for English is honoured', async ({ page, context }) => {
	await context.addCookies([{ name: 'language', value: 'en', url: 'http://localhost:4173' }]);
	await page.goto('/sign-in');

	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
