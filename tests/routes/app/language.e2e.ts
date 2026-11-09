import { expect, test, type Page } from '@playwright/test';

// Every test here changes the member's saved language, so they run one after another.
test.describe.configure({ mode: 'serial' });

async function signIn(page: Page) {
	await page.goto('/sign-in');
	await page.locator('#email').fill('member@demo.com');
	await page.locator('#password').fill('12345678');
	await page.locator('button[type="submit"]').click();
	await page.waitForURL('**/app');
}

async function signOut(page: Page) {
	await page.getByRole('button', { name: /Demo Member/ }).click();
	await page.getByRole('menuitem', { name: /Sign out|ውጣ/ }).click();
	await page.waitForURL('**/sign-in');
}

/** Opens the user menu and picks a language, unless it is already the one in use. */
async function chooseLanguage(page: Page, name: 'English' | 'አማርኛ') {
	await page.getByRole('button', { name: /Demo Member/ }).click();
	const option = page.getByRole('menuitemradio', { name });
	if ((await option.getAttribute('aria-checked')) === 'true') {
		await page.keyboard.press('Escape');
		return;
	}
	await option.click();
	await expect(page.locator('html')).toHaveAttribute('lang', name === 'English' ? 'en' : 'am');
}

test('a language picked in the user menu stays after a reload and on the next sign-in', async ({
	page
}) => {
	await signIn(page);
	await chooseLanguage(page, 'English');

	await chooseLanguage(page, 'አማርኛ');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('lang', 'am');

	await signOut(page);
	await page.context().clearCookies();
	await signIn(page);
	await expect(page.locator('html')).toHaveAttribute('lang', 'am');
	await page.getByRole('button', { name: /Demo Member/ }).click();
	await expect(page.getByRole('menuitemradio', { name: 'አማርኛ' })).toBeChecked();
	await page.keyboard.press('Escape');

	await chooseLanguage(page, 'English');
});

test('in Amharic the sidebar and the screen heading use the Amharic terms', async ({ page }) => {
	await signIn(page);
	await chooseLanguage(page, 'አማርኛ');
	const sidebar = page.locator('[data-sidebar="sidebar"]');

	await expect(sidebar.getByText('ሽያጭ', { exact: true })).toBeVisible();
	await expect(sidebar.getByRole('link', { name: 'ደንበኞች' })).toBeVisible();
	await expect(sidebar.getByText('Customers')).toHaveCount(0);

	await sidebar.getByRole('link', { name: 'ሽያጮች' }).click();
	await expect(page.getByRole('heading', { name: 'ሽያጮች', level: 2 })).toBeVisible();
	await expect(page.getByText('በቅርቡ ይመጣል')).toBeVisible();
	await expect(page).toHaveTitle('ሽያጮች');

	await chooseLanguage(page, 'English');
});

test('in English the sidebar and the user menu use the English terms', async ({ page }) => {
	await signIn(page);
	await chooseLanguage(page, 'English');
	const sidebar = page.locator('[data-sidebar="sidebar"]');

	await sidebar.getByRole('link', { name: 'Sales' }).click();
	await expect(page.getByRole('heading', { name: 'Sales', level: 2 })).toBeVisible();
	await expect(page.getByText('Coming soon')).toBeVisible();
	await page.getByRole('button', { name: /Demo Member/ }).click();
	await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
});
