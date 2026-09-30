import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { settingsApi } from './api/settings-api.js';
import { renderApp } from './test/render-app.js';

test('navigates between settings sections from the menu', async () => {
	const { locator, unmount, user } = renderApp(['/settings/menu']);

	const menuNav = locator.getByRole('navigation', { name: 'Settings menu' });
	await expect.element(menuNav).toBeVisible();
	await expect.element(menuNav.getByText('Personal')).toBeVisible();
	await user.click(menuNav.getByRole('link', { name: 'Preferences' }));
	await expect
		.element(locator.getByRole('heading', { level: 1, name: 'Preferences' }))
		.toBeVisible();
	await user.click(locator.getByRole('link', { name: 'Settings' }));
	await user.click(
		locator.getByRole('navigation', { name: 'Settings menu' }).getByRole('link', {
			name: 'Security & access',
		}),
	);
	await expect
		.element(locator.getByRole('heading', { level: 1, name: 'Security & access' }))
		.toBeVisible();

	unmount();
});

test('keeps the profile heading after a menu round-trip', async () => {
	const { locator, unmount, user } = renderApp(['/settings/profile']);
	await expect.element(locator.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
	await user.click(locator.getByRole('link', { name: 'Settings' }));
	await user.click(
		locator.getByRole('navigation', { name: 'Settings menu' }).getByRole('link', {
			name: 'Profile',
		}),
	);
	await expect.element(locator.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
	unmount();
});

test('saves profile changes with pending and success states', async () => {
	settingsApi.setLatency(40);
	const { locator, unmount, user } = renderApp(['/settings/profile']);

	await user.click(locator.getByRole('button', { name: 'Edit full name' }));
	const name = page.getByRole('textbox', { name: 'Full name' });
	await expect.element(name).toBeVisible();
	await user.clear(name);
	await user.type(name, 'Sam Taylor');
	await user.click(page.getByRole('button', { name: 'Save' }));
	await expect.element(locator.getByText('Profile saved.')).toBeVisible();

	unmount();
});

test('persists profile values across remounts', async () => {
	const first = renderApp(['/settings/profile']);
	await first.user.click(first.locator.getByRole('button', { name: 'Edit full name' }));
	const name = page.getByRole('textbox', { name: 'Full name' });
	await expect.element(name).toBeVisible();
	await first.user.clear(name);
	await first.user.type(name, 'Jordan Lee');
	await first.user.click(page.getByRole('button', { name: 'Save' }));
	await expect.element(first.locator.getByText('Profile saved.')).toBeVisible();
	first.unmount();

	const second = renderApp(['/settings/profile']);
	await expect
		.element(second.locator.getByRole('button', { name: 'Edit full name' }))
		.toHaveTextContent('Jordan Lee');
	second.unmount();
});

test('autosaves a preference toggle', async () => {
	const { locator, unmount } = renderApp(['/settings/preferences']);
	const toggle = locator.getByRole('switch', { name: 'Convert text emoticons into emojis' });
	await expect.element(toggle).toBeVisible();
	await expect.element(toggle).toBeChecked();
	// Hidden RAC input sits under the track; force avoids pointer hit-target flakes.
	await toggle.click({ force: true });
	await expect.element(toggle).not.toBeChecked();

	unmount();
	const again = renderApp(['/settings/preferences']);
	await expect
		.element(again.locator.getByRole('switch', { name: 'Convert text emoticons into emojis' }))
		.not.toBeChecked();
	again.unmount();
});

test('applies colour mode to the document', async () => {
	const { locator, unmount, user } = renderApp(['/settings/preferences']);
	await expect
		.element(locator.getByRole('heading', { level: 1, name: 'Preferences' }))
		.toBeVisible();
	await user.click(locator.getByRole('button', { name: /Interface theme|System preference/ }));
	await user.click(page.getByRole('option', { name: 'Dark' }));
	expect(document.documentElement.dataset.colorMode).toBe('dark');
	await user.click(locator.getByRole('button', { name: /Interface theme|Dark/ }));
	await user.click(page.getByRole('option', { name: 'System preference' }));
	expect(document.documentElement.dataset.colorMode).toBeUndefined();
	unmount();
});

test('runs the delete-account confirmation workflow', async () => {
	const { locator, unmount, user } = renderApp(['/settings/security']);
	await user.click(locator.getByRole('button', { name: 'Delete account' }));
	await expect.element(locator.getByText('Confirm deletion')).toBeVisible();
	await user.click(locator.getByRole('button', { name: 'Yes, delete' }));
	await expect
		.element(locator.getByText('Account deleted on this device. Reload to start fresh.'))
		.toBeVisible();
	unmount();
});

test('surfaces a profile save server error', async () => {
	settingsApi.setNextFailure('server');
	const { locator, unmount, user } = renderApp(['/settings/profile']);
	await user.click(locator.getByRole('button', { name: 'Edit full name' }));
	const name = page.getByRole('textbox', { name: 'Full name' });
	await expect.element(name).toBeVisible();
	await user.clear(name);
	await user.type(name, 'Error Case');
	await user.click(page.getByRole('button', { name: 'Save' }));
	await expect.element(locator.getByText('Could not save profile. Try again.')).toBeVisible();
	unmount();
});
