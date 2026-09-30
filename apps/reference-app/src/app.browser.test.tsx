import axe from 'axe-core';
import { act } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { settingsApi } from './api/settings-api.js';
import { renderApp } from './test/render-app.js';

test('home opens settings, desktop navigation follows the URL, and Back to app returns home', async () => {
	const app = await renderApp(['/']);
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Welcome back, Boricio' }))
		.toBeVisible();
	await app.user.click(app.locator.getByRole('link', { name: 'Open settings' }));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Preferences' }))
		.toBeVisible();
	expect(app.router.state.location.pathname).toBe('/settings/preferences');
	const navigation = app.locator.getByRole('navigation', { name: 'Settings' });
	await expect
		.element(navigation.getByRole('link', { name: 'Preferences' }))
		.toHaveAttribute('aria-current', 'page');
	await app.user.click(navigation.getByRole('link', { name: 'Profile' }));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Profile' }))
		.toHaveFocus();
	expect(app.router.state.location.pathname).toBe('/settings/profile');
	await expect
		.element(navigation.getByRole('link', { name: 'Profile' }))
		.toHaveAttribute('aria-current', 'page');
	await act(() => app.router.navigate(-1));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Preferences' }))
		.toHaveFocus();
	await app.user.click(app.locator.getByRole('link', { name: 'Back to app' }));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Welcome back, Boricio' }))
		.toBeVisible();
	expect(app.router.state.location.pathname).toBe('/');
});

test('a narrow deep link opens the menu and supports back navigation', async () => {
	await page.viewport(390, 800);
	const app = await renderApp(['/settings/security']);
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Security & access' }))
		.toBeVisible();
	await app.user.click(app.locator.getByRole('link', { name: 'Settings', exact: true }));
	const menu = app.locator.getByRole('navigation', { name: 'Settings menu' });
	await expect.element(menu).toBeVisible();
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Settings' }))
		.toHaveFocus();
	await app.user.click(menu.getByRole('link', { name: 'Profile' }));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Profile' }))
		.toHaveFocus();
	expect(app.router.state.location.pathname).toBe('/settings/profile');
	await act(() => app.router.navigate(-1));
	await expect.element(menu).toBeVisible();
	await act(() => app.router.navigate(-1));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Security & access' }))
		.toHaveFocus();
});

test('inline profile fields validate, save once while pending, retry failures, and persist', async () => {
	const app = await renderApp(['/settings/profile']);
	const name = app.locator.getByRole('textbox', { name: 'Full name' });
	await editName(app, '   ');
	await app.user.keyboard('{Enter}');
	await expect.element(app.locator.getByRole('alert')).toHaveTextContent('Name is required');
	await expect.element(name).toHaveAttribute('aria-invalid', 'true');
	await app.user.keyboard('{Escape}');
	await expect.element(name).toHaveValue('Boricio Jones');

	await app.user.fill(name, 'Jordan Lee');
	settingsApi.setNextFailure('server');
	await app.user.keyboard('{Enter}');
	await expect.element(name).toHaveAccessibleDescription('Could not save profile. Try again.');
	await expect.element(name).toHaveValue('Jordan Lee');
	await expect.element(name).toHaveFocus();

	settingsApi.setLatency(800);
	const mutation = vi.spyOn(settingsApi, 'updateProfile');
	await app.user.keyboard('{Enter}');
	await expect.element(name).toHaveAttribute('readonly');
	await app.user.keyboard('{Escape}{Enter}');
	await expect.element(name).toHaveValue('Jordan Lee');
	await act(() => app.router.navigate('/settings/preferences'));
	await act(() => app.router.navigate('/settings/profile'));
	await expect.element(name).toHaveAttribute('readonly');
	await expectProfileName(app, 'Jordan Lee');
	await expect.element(name).not.toHaveAttribute('readonly');
	expect(mutation).toHaveBeenCalledOnce();

	settingsApi.setLatency(0);
	app.unmount();
	const again = await renderApp(['/settings/profile']);
	await expectProfileName(again, 'Jordan Lee');
});

test('change email validates, keeps the dialog open on failure, and restores focus', async () => {
	const app = await renderApp(['/settings/profile']);
	const trigger = app.locator.getByRole('button', { name: 'Change email' });
	await app.user.click(trigger);
	const dialog = page.getByRole('dialog', { name: 'Change email' });
	await expect
		.element(dialog)
		.toHaveAccessibleDescription(/verification link to your new email address/);
	await app.user.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();

	await app.user.click(trigger);
	const input = dialog.getByRole('textbox', { name: 'New email address' });
	const submit = dialog.getByRole('button', { name: 'Check for existing account', exact: true });
	await app.user.fill(input, 'not-an-email');
	await app.user.click(submit);
	await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	await expect.element(input).toHaveFocus();
	await app.user.fill(input, 'boricio@example.com');
	await app.user.click(submit);
	await expect
		.element(dialog.getByRole('alert'))
		.toHaveTextContent('Enter a different email address');
	await app.user.fill(input, 'sam@example.com');
	settingsApi.setNextFailure('server');
	await app.user.keyboard('{Enter}');
	await expect.element(input).toHaveAccessibleDescription('Could not save profile. Try again.');
	await expect.element(input).toHaveValue('sam@example.com');
	await expect.element(input).toHaveFocus();
	await app.user.keyboard('{Enter}');
	await expect.element(dialog).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
	await expect.element(app.locator.getByText('sam@example.com')).toBeVisible();
	expect((await settingsApi.getSettings()).profile.email).toBe('sam@example.com');
});

test('profile picture rejects invalid files, retries a failed save, and can be removed', async () => {
	const app = await renderApp(['/settings/profile']);
	const avatar = app.locator.getByRole('button', { name: 'Profile picture', exact: true });
	await expect.element(avatar).toHaveTextContent('BJ');
	const input = app.locator.getByLabelText('Upload profile picture');
	await input.upload(new File(['<svg/>'], 'picture.svg', { type: 'image/svg+xml' }));
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Choose a PNG, JPG or WebP image.');
	await input.upload(new File(['invalid image'], 'invalid.png', { type: 'image/png' }));
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not read this image. Choose another file.');
	settingsApi.setNextFailure('server');
	await input.upload(
		new File(
			[Uint8Array.from(atob(SMALL_PNG), (character) => character.charCodeAt(0))],
			'picture.png',
			{ type: 'image/png' },
		),
	);
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save profile. Try again.');
	await expect.element(avatar).toHaveTextContent('BJ');
	await app.user.click(app.locator.getByRole('button', { name: 'Try again' }));
	await expect
		.element(app.locator.getByRole('status'))
		.toHaveTextContent('Profile picture updated.');
	expect(avatar.element().querySelector('img')).not.toBeNull();

	await app.user.click(avatar);
	await app.user.click(page.getByRole('menuitem', { name: 'Remove picture' }));
	await expect.element(avatar).toHaveTextContent('BJ');
	app.unmount();
	const again = await renderApp(['/settings/profile']);
	await expect
		.element(again.locator.getByRole('button', { name: 'Profile picture', exact: true }))
		.toHaveTextContent('BJ');
	expect((await settingsApi.getSettings()).profile.avatarDataUrl).toBeNull();
});

test('keyboard autosave updates a switch and persists after remount', async () => {
	const app = await renderApp();
	const toggle = app.locator.getByRole('switch', { name: 'Underline links' });
	await expect.element(toggle).not.toBeChecked();
	settingsApi.setLatency(500);
	const mutation = vi.spyOn(settingsApi, 'updatePreferences');
	toggle.element().focus();
	await app.user.keyboard(' ');
	await expect.element(toggle).toBeChecked();
	await expect.element(app.locator.getByRole('status')).toHaveTextContent('Saving…');
	await app.user.keyboard(' ');
	await expect.element(toggle).toBeChecked();
	expect(mutation).toHaveBeenCalledOnce();
	await expect.element(app.locator.getByRole('status')).not.toBeInTheDocument();
	await expect.element(toggle).toHaveFocus();
	settingsApi.setLatency(0);
	app.unmount();
	const again = await renderApp();
	await expect
		.element(again.locator.getByRole('switch', { name: 'Underline links' }))
		.toBeChecked();
	expect(document.documentElement.dataset.underlineLinks).toBe('true');
});

test('a failed theme change rolls back, and explicit and system themes apply', async () => {
	const app = await renderApp();
	const trigger = app.locator.getByRole('button', { name: /Theme/ });
	settingsApi.setLatency(1200);
	settingsApi.setNextFailure('server');
	await chooseOption(app, 'Theme', 'Dark');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	await expect.element(trigger).toHaveAttribute('aria-disabled', 'true');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save preferences. Try again.');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBeUndefined();
	await expect.element(trigger).toHaveFocus();
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('light');

	settingsApi.setLatency(0);
	await chooseOption(app, 'Theme', 'Dark');
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('dark');
	expect((await settingsApi.getSettings()).preferences.colorMode).toBe('dark');
	await chooseOption(app, 'Theme', 'System');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBeUndefined();
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('light');
	await emulateScheme('dark');
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('dark');
	app.unmount();
	const again = await renderApp();
	await expect
		.element(again.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('System');
});

test('text size changes actual heading geometry', async () => {
	const app = await renderApp();
	const heading = app.locator.getByRole('heading', { name: 'Preferences', level: 1 });
	await expect.element(heading).toBeVisible();
	const initialHeight = heading.element().getBoundingClientRect().height;
	await chooseOption(app, 'Text size', 'Large');
	await expect
		.poll(() => heading.element().getBoundingClientRect().height)
		.toBeGreaterThan(initialHeight);
});

test('clearing saved settings waits for saves, cancels, retries failures, and restores defaults', async () => {
	await settingsApi.updateProfile({ displayName: 'Jordan Lee' });
	await settingsApi.updatePreferences({ colorMode: 'dark' });
	const app = await renderApp();
	settingsApi.setLatency(500);
	await chooseOption(app, 'Theme', 'Light');
	await act(() => app.router.navigate('/settings/security'));
	const trigger = app.locator.getByRole('button', { name: 'Clear saved settings' });
	await expect.element(trigger).toBeDisabled();
	await expect.element(app.locator.getByRole('status')).toHaveTextContent('Saving…');
	await expect.element(trigger).toBeEnabled();
	settingsApi.setLatency(0);

	await app.user.click(trigger);
	await app.user.click(page.getByRole('button', { name: 'Cancel' }));
	await expect.element(trigger).toHaveFocus();
	expect((await settingsApi.getSettings()).profile.displayName).toBe('Jordan Lee');

	await app.user.click(trigger);
	const dialog = page.getByRole('alertdialog', { name: 'Clear saved settings?' });
	const confirm = dialog.getByRole('button', { name: 'Clear settings', exact: true });
	settingsApi.setNextFailure('server');
	await app.user.click(confirm);
	await expect
		.element(dialog.getByRole('alert'))
		.toHaveTextContent('Could not clear saved settings. Try again.');
	settingsApi.setLatency(500);
	await app.user.click(confirm);
	await app.user.keyboard('{Escape}');
	await expect.element(dialog).toBeVisible();
	await expect.element(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
	await expect.element(app.locator.getByRole('status')).toHaveTextContent('Saved settings cleared');
	await expect.element(trigger).toHaveFocus();
	settingsApi.setLatency(0);

	await act(() => app.router.navigate('/settings/profile'));
	await expect
		.element(app.locator.getByRole('textbox', { name: 'Full name' }))
		.toHaveValue('Boricio Jones');
	await act(() => app.router.navigate('/settings/preferences'));
	await expect
		.element(app.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('System');
	expect(document.documentElement.dataset.colorMode).toBeUndefined();
	app.unmount();
	const again = await renderApp();
	await expect
		.element(again.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('System');
});

test('home, settings pages, and portalled dialogs have no axe violations', async () => {
	const app = await renderApp(['/']);
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Welcome back, Boricio' }))
		.toBeVisible();
	await expectAccessible(app.container);
	await act(() => app.router.navigate('/settings/profile'));
	await expect
		.element(app.locator.getByRole('heading', { name: 'Profile', level: 1 }))
		.toBeVisible();
	await expectAccessible(app.container);
	await app.user.click(app.locator.getByRole('button', { name: 'Change email' }));
	await expect.element(page.getByRole('dialog', { name: 'Change email' })).toBeVisible();
	await expectAccessible(app.container);
	await app.user.keyboard('{Escape}');
	await act(() => app.router.navigate('/settings/preferences'));
	await chooseOption(app, 'Theme', 'Dark');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	await expectAccessible(app.container);
	await page.viewport(390, 800);
	await app.user.click(app.locator.getByRole('link', { name: 'Settings', exact: true }));
	await expect
		.element(app.locator.getByRole('navigation', { name: 'Settings menu' }))
		.toBeVisible();
	await expectAccessible(app.container);
});

type App = Awaited<ReturnType<typeof renderApp>>;
const SMALL_PNG =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

async function editName(app: App, value: string) {
	const input = app.locator.getByRole('textbox', { name: 'Full name' });
	await expect.element(input).toBeVisible();
	await app.user.click(input);
	await expect.element(input).toHaveFocus();
	await app.user.fill(input, value);
}

async function expectProfileName(app: App, name: string) {
	await expect.element(app.locator.getByRole('textbox', { name: 'Full name' })).toHaveValue(name);
	expect((await settingsApi.getSettings()).profile.displayName).toBe(name);
}

async function chooseOption(app: App, label: string, option: string) {
	await app.user.click(app.locator.getByRole('button', { name: new RegExp(label) }));
	await app.user.click(page.getByRole('option', { name: option, exact: true }));
}

async function emulateScheme(value: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value }],
	});
}

async function expectAccessible(container: HTMLElement) {
	// Audit final theme colors after finite transitions finish.
	const finiteAnimations = document.getAnimations().filter((animation) => {
		if (animation.playState !== 'running') return false;
		const timing = animation.effect?.getComputedTiming();
		return (
			timing !== undefined && Number.isFinite(timing.duration) && Number.isFinite(timing.iterations)
		);
	});
	await Promise.all(finiteAnimations.map((animation) => animation.finished.catch(() => undefined)));
	const dialog = document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');
	const result = await axe.run({ include: dialog ? [container, dialog] : [container] });
	expect(
		result.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => ({ html: node.html, checks: node.any })),
		})),
	).toEqual([]);
}
