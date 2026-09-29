import { expect, test } from 'vite-plus/test';
import { settingsApi } from './api/settings-api.js';
import { renderApp } from './test/render-app.js';

test('navigates between settings sections from the menu', async () => {
	const { locator, unmount, user } = renderApp(['/settings/menu']);

	await expect.element(locator.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
	await user.click(locator.getByRole('link', { name: 'Preferences' }));
	await expect
		.element(locator.getByRole('heading', { name: 'Preferences', level: 1 }))
		.toBeVisible();
	await user.click(locator.getByRole('link', { name: '← Settings' }));
	await user.click(locator.getByRole('link', { name: 'Interface' }));
	await expect.element(locator.getByRole('heading', { name: 'Interface', level: 1 })).toBeVisible();

	unmount();
});

test('keeps the profile heading after a menu round-trip', async () => {
	const { locator, unmount, user } = renderApp(['/settings/profile']);
	await expect.element(locator.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
	await user.click(locator.getByRole('link', { name: '← Settings' }));
	await user.click(locator.getByRole('link', { name: 'Profile' }));
	await expect.element(locator.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
	unmount();
});

test('saves profile changes with pending and success states', async () => {
	settingsApi.setLatency(40);
	const { locator, unmount, user } = renderApp(['/settings/profile']);

	const name = locator.getByRole('textbox', { name: 'Preferred name' });
	await expect.element(name).toBeVisible();
	await user.clear(name);
	await user.type(name, 'Sam Taylor');
	await user.click(locator.getByRole('button', { name: 'Save' }));
	await expect.element(locator.getByText('Profile saved.')).toBeVisible();

	unmount();
});

test('persists profile values across remounts', async () => {
	const first = renderApp(['/settings/profile']);
	const name = first.locator.getByRole('textbox', { name: 'Preferred name' });
	await expect.element(name).toBeVisible();
	await first.user.clear(name);
	await first.user.type(name, 'Jordan Lee');
	await first.user.click(first.locator.getByRole('button', { name: 'Save' }));
	await expect.element(first.locator.getByText('Profile saved.')).toBeVisible();
	first.unmount();

	const second = renderApp(['/settings/profile']);
	await expect
		.element(second.locator.getByRole('textbox', { name: 'Preferred name' }))
		.toHaveValue('Jordan Lee');
	second.unmount();
});

test('autosaves a preference toggle', async () => {
	const { locator, unmount, user } = renderApp(['/settings/preferences']);
	const toggle = locator.getByRole('switch', { name: 'Display full names' });
	await expect.element(toggle).toHaveAttribute('aria-checked', 'false');
	await user.click(toggle);
	await expect.element(toggle).toHaveAttribute('aria-checked', 'true');

	unmount();
	const again = renderApp(['/settings/preferences']);
	await expect
		.element(again.locator.getByRole('switch', { name: 'Display full names' }))
		.toHaveAttribute('aria-checked', 'true');
	again.unmount();
});

test('applies colour mode to the document', async () => {
	const { locator, unmount, user } = renderApp(['/settings/interface']);
	const select = locator.getByLabelText('Colour mode');
	await user.selectOptions(select, 'dark');
	expect(document.documentElement.dataset.colorMode).toBe('dark');
	await user.selectOptions(select, 'system');
	expect(document.documentElement.dataset.colorMode).toBeUndefined();
	unmount();
});

test('runs the delete-account confirmation workflow', async () => {
	const { locator, unmount, user } = renderApp(['/settings/account']);
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
	const name = locator.getByRole('textbox', { name: 'Preferred name' });
	await expect.element(name).toBeVisible();
	await user.clear(name);
	await user.type(name, 'Error Case');
	await user.click(locator.getByRole('button', { name: 'Save' }));
	await expect.element(locator.getByText('Could not save profile. Try again.')).toBeVisible();
	unmount();
});
