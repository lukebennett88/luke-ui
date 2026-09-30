import axe from 'axe-core';
import { act } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { settingsApi } from './api/settings-api.js';
import { renderApp } from './test/render-app.js';

test('desktop navigation follows the URL and focuses the heading', async () => {
	const app = await renderApp(['/settings/profile']);
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Profile' }))
		.toBeVisible();
	const navigation = app.locator.getByRole('navigation', { name: 'Settings' });
	await expect
		.element(navigation.getByRole('link', { name: 'Profile' }))
		.toHaveAttribute('aria-current', 'page');
	await app.user.click(navigation.getByRole('link', { name: 'Preferences' }));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Preferences' }))
		.toHaveFocus();
	expect(app.router.state.location.pathname).toBe('/settings/preferences');
	await expect
		.element(navigation.getByRole('link', { name: 'Preferences' }))
		.toHaveAttribute('aria-current', 'page');
	await act(() => app.router.navigate(-1));
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: 'Profile' }))
		.toHaveFocus();
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

test('Enter saves once, blocks duplicate commits while pending, and persists the name', async () => {
	const app = await renderApp(['/settings/profile']);
	const name = app.locator.getByRole('textbox', { name: 'Full name' });
	await editName(app, ' Sam Taylor ');
	settingsApi.setLatency(800);
	const mutation = vi.spyOn(settingsApi, 'updateProfile');
	await app.user.keyboard('{Enter}');
	await expect.element(name).toHaveAttribute('readonly');
	await app.user.keyboard('{Escape}');
	await expect.element(name).toHaveAttribute('readonly');
	await app.user.keyboard('{Enter}');
	await expect.element(name).toHaveValue(' Sam Taylor ');
	await expect.element(name).toHaveFocus();
	expect(mutation).toHaveBeenCalledTimes(1);
	await expectProfileName(app, 'Sam Taylor');
	settingsApi.setLatency(0);
	await act(() => app.router.navigate('/settings/preferences'));
	await act(() => app.router.navigate('/settings/profile'));
	await expect.element(name).toHaveValue('Sam Taylor');
	app.unmount();
	const again = await renderApp(['/settings/profile']);
	await expect
		.element(again.locator.getByRole('textbox', { name: 'Full name' }))
		.toHaveValue('Sam Taylor');
});

test('a failed save preserves the draft and retries from the field', async () => {
	const app = await renderApp(['/settings/profile']);
	const name = app.locator.getByRole('textbox', { name: 'Full name' });
	await editName(app, 'Jordan Lee');
	settingsApi.setNextFailure('server');
	await app.user.keyboard('{Enter}');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save profile. Try again.');
	await expect.element(name).toHaveValue('Jordan Lee');
	await expect.element(name).toHaveAccessibleDescription('Could not save profile. Try again.');
	await app.user.keyboard('{Enter}');
	await expect.element(name).toHaveValue('Jordan Lee');
});

test('inline fields submit fresh drafts after success, validation and retry', async () => {
	const app = await renderApp(['/settings/profile']);
	const input = app.locator.getByRole('textbox', { name: 'Full name' });
	await editName(app, 'First name');
	await app.user.keyboard('{Enter}');
	await expect.element(input).toHaveValue('First name');
	await editName(app, '   ');
	await app.user.keyboard('{Enter}');
	await expect.element(app.locator.getByRole('alert')).toHaveTextContent('Name is required');
	await app.user.keyboard('{Escape}');
	await expect.element(input).toHaveValue('First name');
	await app.user.fill(input, 'Second name');
	settingsApi.setNextFailure('server');
	await app.user.keyboard('{Enter}');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save profile. Try again.');
	await expect.element(input).toHaveValue('Second name');
	await expect.element(input).toHaveFocus();
	await app.user.keyboard('{Enter}');
	await expect.element(input).toHaveValue('Second name');
});

test('change email opens a dialog, validates input, and persists updates', async () => {
	const app = await renderApp(['/settings/profile']);
	await expect.element(app.locator.getByText('boricio@example.com')).toBeVisible();
	await app.user.click(app.locator.getByRole('button', { name: 'Change email' }));
	const dialog = page.getByRole('dialog', { name: 'Change email' });
	await expect.element(dialog).toBeVisible();
	const input = dialog.getByRole('textbox', { name: 'New email address' });
	await app.user.fill(input, 'not-an-email');
	await app.user.click(
		dialog.getByRole('button', { name: 'Check for existing account', exact: true }),
	);
	await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	await app.user.fill(input, 'boricio@example.com');
	await app.user.click(
		dialog.getByRole('button', { name: 'Check for existing account', exact: true }),
	);
	await expect
		.element(dialog.getByRole('alert'))
		.toHaveTextContent('Enter a different email address');
	await app.user.fill(input, 'sam@example.com');
	settingsApi.setNextFailure('server');
	await app.user.keyboard('{Enter}');
	await expect.element(input).toHaveAccessibleDescription('Could not save profile. Try again.');
	await expect.element(input).toHaveValue('sam@example.com');
	await app.user.keyboard('{Enter}');
	await expect.element(dialog).not.toBeInTheDocument();
	await expect.element(app.locator.getByRole('button', { name: 'Change email' })).toHaveFocus();
	await expect.element(app.locator.getByText('sam@example.com')).toBeVisible();
	app.unmount();
	const again = await renderApp(['/settings/profile']);
	await expect.element(again.locator.getByText('sam@example.com')).toBeVisible();
	expect((await settingsApi.getSettings()).profile.email).toBe('sam@example.com');
});

test('change email descriptions are unique and keyboard dismissal restores focus', async () => {
	const app = await renderApp(['/settings/profile']);
	const trigger = app.locator.getByRole('button', { name: 'Change email' });
	await app.user.click(trigger);
	const dialog = page.getByRole('dialog', { name: 'Change email' });
	const descriptionIds = dialog.element().getAttribute('aria-describedby')?.split(/\s+/) ?? [];
	expect(descriptionIds).toHaveLength(1);
	const [descriptionId] = descriptionIds;
	expect(
		[...dialog.element().querySelectorAll('[id]')].filter(
			(element) => element.id === descriptionId,
		),
	).toHaveLength(1);
	await expect
		.element(dialog)
		.toHaveAccessibleDescription(/verification link to your new email address/);
	await app.user.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('client and server field errors keep their editable drafts', async () => {
	const app = await renderApp(['/settings/profile']);
	const fullName = app.locator.getByRole('textbox', { name: 'Full name' });
	await editName(app, '   ');
	await app.user.keyboard('{Enter}');
	await expect.element(app.locator.getByRole('alert')).toHaveTextContent('Name is required');
	await expect.element(fullName).toHaveAttribute('aria-invalid', 'true');
	await app.user.keyboard('{Escape}');
	const username = app.locator.getByRole('textbox', { name: 'Username' });
	await app.user.click(username);
	await app.user.fill(username, 'UPPER CASE');
	await app.user.keyboard('{Enter}');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Use lowercase letters, numbers, and hyphens');
	await app.user.fill(username, 'taken');
	await app.user.keyboard('{Enter}');
	await expect.element(app.locator.getByRole('alert')).toHaveTextContent('Username is taken');
	await expect.element(username).toHaveValue('taken');
	await expect.element(username).toHaveAccessibleDescription(/Username is taken/);
	await app.user.fill(username, 'jordan-lee');
	await app.user.keyboard('{Enter}');
	await expect.element(username).toHaveValue('jordan-lee');
});

test('invalid blur does not reclaim keyboard focus', async () => {
	const app = await renderApp(['/settings/profile']);
	const fullName = app.locator.getByRole('textbox', { name: 'Full name' });
	const title = app.locator.getByRole('textbox', { name: 'Job title' });
	await editName(app, '   ');
	await app.user.keyboard('{Tab}');
	await expect.element(app.locator.getByRole('alert')).toHaveTextContent('Name is required');
	await expect.element(title).toHaveFocus();
	await expect.element(fullName).toHaveValue('   ');
	await app.user.click(fullName);
	await app.user.fill(fullName, 'Jordan Lee');
	settingsApi.setNextFailure('server');
	await app.user.keyboard('{Tab}');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save profile. Try again.');
	await expect.element(title).toHaveFocus();
});

test('independent profile fields can save while another field is pending', async () => {
	const app = await renderApp(['/settings/profile']);
	const name = app.locator.getByRole('textbox', { name: 'Full name' });
	const title = app.locator.getByRole('textbox', { name: 'Job title' });
	const mutation = vi.spyOn(settingsApi, 'updateProfile');
	settingsApi.setLatency(500);
	await editName(app, 'Jordan Lee');
	await app.user.keyboard('{Enter}');
	await expect.element(name).toHaveAttribute('readonly');
	await app.user.click(title);
	await app.user.fill(title, 'Lead designer');
	await app.user.keyboard('{Enter}');
	await expect.element(title).toHaveAttribute('readonly');
	await expect
		.poll(async () => {
			const settings = await settingsApi.getSettings();
			return [settings.profile.displayName, settings.profile.title];
		})
		.toEqual(['Jordan Lee', 'Lead designer']);
	expect(mutation).toHaveBeenCalledTimes(2);
	settingsApi.setLatency(0);
});

test('picture validation, retry and removal preserve saved data', async () => {
	const app = await renderApp(['/settings/profile']);
	await expect
		.element(app.locator.getByRole('button', { name: 'Profile picture', exact: true }))
		.toHaveTextContent('BJ');
	const input = app.locator.getByLabelText('Upload profile picture');
	await input.upload(new File(['<svg/>'], 'picture.svg', { type: 'image/svg+xml' }));
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Choose a PNG, JPG or WebP image.');
	await input.upload(
		new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
	);
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Choose an image smaller than 1 MB.');
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
	await expect
		.element(app.locator.getByRole('button', { name: 'Profile picture', exact: true }))
		.not.toBeDisabled();
	await expect.element(app.locator.getByRole('status')).not.toBeInTheDocument();
	await app.user.click(app.locator.getByRole('button', { name: 'Try again' }));
	await expect
		.element(app.locator.getByRole('status'))
		.toHaveTextContent('Profile picture updated.');
	expect(
		app.locator
			.getByRole('button', { name: 'Profile picture', exact: true })
			.element()
			.querySelector('img'),
	).not.toBeNull();
	app.unmount();
	const again = await renderApp(['/settings/profile']);
	await expect
		.element(again.locator.getByRole('button', { name: 'Profile picture', exact: true }))
		.toBeVisible();
	expect(
		again.locator
			.getByRole('button', { name: 'Profile picture', exact: true })
			.element()
			.querySelector('img'),
	).not.toBeNull();
	await again.user.click(
		again.locator.getByRole('button', { name: 'Profile picture', exact: true }),
	);
	await again.user.click(page.getByRole('menuitem', { name: 'Remove picture' }));
	await expect
		.element(again.locator.getByRole('status'))
		.toHaveTextContent('Profile picture updated.');
	again.unmount();
	const removed = await renderApp(['/settings/profile']);
	await expect
		.element(removed.locator.getByRole('button', { name: 'Profile picture', exact: true }))
		.toHaveTextContent('BJ');
});

test('an image read completed after navigation does not save a profile picture', async () => {
	const app = await renderApp(['/settings/profile']);
	const mutation = vi.spyOn(settingsApi, 'updateProfile');
	let finishRead: (() => void) | undefined;
	let finishDecode: (() => void) | undefined;
	vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
		finishRead = () => {
			Object.defineProperty(this, 'result', { value: `data:image/png;base64,${SMALL_PNG}` });
			this.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>);
		};
	});
	vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (
		this: HTMLImageElement,
	) {
		Object.defineProperty(this, 'naturalWidth', { value: 1 });
		Object.defineProperty(this, 'naturalHeight', { value: 1 });
		finishDecode = () => this.onload?.(new Event('load'));
	});
	const transfer = new DataTransfer();
	transfer.items.add(
		new File(
			[Uint8Array.from(atob(SMALL_PNG), (character) => character.charCodeAt(0))],
			'picture.png',
			{ type: 'image/png' },
		),
	);
	const input = app.locator.getByLabelText('Upload profile picture').element() as HTMLInputElement;
	input.files = transfer.files;
	await act(async () => {
		input.dispatchEvent(new Event('change', { bubbles: true }));
	});
	await expect
		.element(app.locator.getByRole('status'))
		.toHaveTextContent('Updating profile picture…');
	await act(() => app.router.navigate('/settings/preferences'));
	finishRead?.();
	await expect.poll(() => typeof finishDecode).toBe('function');
	await act(async () => {
		finishDecode?.();
	});
	await act(() => app.router.navigate('/settings/profile'));
	await expect
		.element(app.locator.getByRole('button', { name: 'Profile picture', exact: true }))
		.toHaveTextContent('BJ');
	expect(mutation).not.toHaveBeenCalled();
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
	await expect.element(toggle).toHaveFocus();
	await expect.element(app.locator.getByRole('status')).toHaveTextContent('Saving…');
	await app.user.keyboard(' ');
	await expect.element(toggle).toBeChecked();
	expect(mutation).toHaveBeenCalledOnce();
	await expect.element(toggle).toBeEnabled();
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

test('a failed preference rolls back the document and can retry', async () => {
	const app = await renderApp();
	const trigger = app.locator.getByRole('button', { name: /Theme/ });
	await expect.element(app.locator.getByRole('heading', { name: 'Preferences' })).toBeVisible();
	settingsApi.setLatency(1200);
	settingsApi.setNextFailure('server');
	const mutation = vi.spyOn(settingsApi, 'updatePreferences');
	await chooseOption(app, 'Theme', 'Dark');
	await expect.element(trigger).toHaveFocus();
	await expect.element(trigger).toHaveAttribute('aria-disabled', 'true');
	await app.user.keyboard('{ArrowDown}{Enter}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	expect(mutation).toHaveBeenCalledOnce();
	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save preferences. Try again.');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBeUndefined();
	await expect.element(trigger).toHaveFocus();
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('light');
	await chooseOption(app, 'Theme', 'Dark');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	await expect.element(trigger).not.toHaveAttribute('aria-disabled', 'true');
	expect((await settingsApi.getSettings()).preferences.colorMode).toBe('dark');
});

for (const failure of ['none', 'server'] as const) {
	test(`preference ${failure === 'none' ? 'success' : 'failure'} settles after navigation`, async () => {
		const app = await renderApp();
		let releasePreference = () => {};
		if (failure === 'server') {
			settingsApi.setLatency(0);
			const originalUpdatePreferences = settingsApi.updatePreferences.bind(settingsApi);
			const preferenceGate = new Promise<void>((resolve) => {
				releasePreference = resolve;
			});
			vi.spyOn(settingsApi, 'updatePreferences').mockImplementation(async (patch) => {
				const result = await originalUpdatePreferences(patch).then(
					(settings) => ({ settings }),
					(error: unknown) => ({ error }),
				);
				await preferenceGate;
				if ('error' in result) throw result.error;
				return result.settings;
			});
		} else {
			settingsApi.setLatency(400);
		}
		settingsApi.setNextFailure(failure);
		await chooseOption(app, 'Theme', 'Dark');
		await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
		await act(() => app.router.navigate('/settings/profile'));
		await expect.element(app.locator.getByRole('heading', { name: 'Profile' })).toBeVisible();
		if (failure === 'server') {
			await editName(app, 'Jordan Lee');
			await app.user.keyboard('{Enter}');
			await expectProfileName(app, 'Jordan Lee');
			await expectDocumentColorMode('dark');
			releasePreference();
		}
		const expectedMode = failure === 'none' ? 'dark' : undefined;
		await expect.poll(() => document.documentElement.dataset.colorMode).toBe(expectedMode);
		await act(() => app.router.navigate('/settings/preferences'));
		await expect
			.element(app.locator.getByRole('button', { name: /Theme/ }))
			.toHaveTextContent(failure === 'none' ? 'Dark' : 'System');
		app.unmount();
		const again = await renderApp(['/settings/profile']);
		await expect.element(again.locator.getByRole('heading', { name: 'Profile' })).toBeVisible();
		await expectProfileName(again, failure === 'server' ? 'Jordan Lee' : 'Boricio Jones');
		expect(document.documentElement.dataset.colorMode).toBe(expectedMode);
	});
}

test('explicit and system themes follow persisted choice and media changes', async () => {
	const app = await renderApp();
	await expect.element(app.locator.getByRole('heading', { name: 'Preferences' })).toBeVisible();
	await chooseOption(app, 'Theme', 'Dark');
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('dark');
	app.unmount();
	const again = await renderApp();
	await expect
		.element(again.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('Dark');
	await chooseOption(again, 'Theme', 'System');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBeUndefined();
	await emulateScheme('light');
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('light');
	await emulateScheme('dark');
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('dark');
	expect(document.documentElement.dataset.colorMode).toBeUndefined();
	again.unmount();
	const system = await renderApp();
	await expect
		.element(system.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('System');
	await expect.poll(() => getComputedStyle(document.documentElement).colorScheme).toBe('dark');
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
	app.unmount();
	const again = await renderApp();
	await expect
		.element(again.locator.getByRole('button', { name: /Text size/ }))
		.toHaveTextContent('Large');
	await expect
		.poll(
			() =>
				again.locator
					.getByRole('heading', { name: 'Preferences', level: 1 })
					.element()
					.getBoundingClientRect().height,
		)
		.toBeGreaterThan(initialHeight);
});

test('clearing browser data cancels, fails, retries and restores persisted defaults', async () => {
	await settingsApi.updateProfile({ displayName: 'Jordan Lee' });
	await settingsApi.updatePreferences({ colorMode: 'dark' });
	const app = await renderApp(['/settings/preferences']);
	settingsApi.setNextFailure('server');
	await chooseOption(app, 'Theme', 'System');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save preferences. Try again.');

	let releasePreference = () => {};
	const preferenceGate = new Promise<void>((resolve) => {
		releasePreference = resolve;
	});
	const originalUpdatePreferences = settingsApi.updatePreferences.bind(settingsApi);
	const updatePreferences = vi
		.spyOn(settingsApi, 'updatePreferences')
		.mockImplementation(async (patch) => {
			const settings = await originalUpdatePreferences(patch);
			await preferenceGate;
			return settings;
		});
	await chooseOption(app, 'Theme', 'Light');
	await expect.element(app.locator.getByRole('status')).toHaveTextContent('Saving…');
	expect(updatePreferences).toHaveBeenCalledOnce();
	await act(() => app.router.navigate('/settings/security'));
	const trigger = app.locator.getByRole('button', { name: 'Clear saved settings' });
	try {
		await expect.element(trigger).toBeDisabled();
		await expect.element(app.locator.getByRole('status')).toHaveTextContent('Saving…');
	} finally {
		releasePreference();
	}
	await expect.element(trigger).toBeEnabled();

	await act(() => app.router.navigate('/settings/preferences'));
	settingsApi.setNextFailure('server');
	await chooseOption(app, 'Theme', 'System');
	await expect
		.element(app.locator.getByRole('alert'))
		.toHaveTextContent('Could not save preferences. Try again.');
	await act(() => app.router.navigate('/settings/security'));
	await expect
		.element(app.locator.getByRole('heading', { name: 'Security & access' }))
		.toBeVisible();
	await expect.element(trigger).toBeEnabled();

	await app.user.click(trigger);
	await app.user.click(page.getByRole('button', { name: 'Cancel' }));
	await expect.element(trigger).toHaveFocus();
	expect((await settingsApi.getSettings()).profile.displayName).toBe('Jordan Lee');
	await app.user.click(trigger);
	settingsApi.setNextFailure('server');
	await app.user.click(page.getByRole('button', { name: 'Clear settings', exact: true }));
	const dialog = page.getByRole('alertdialog', { name: 'Clear saved settings?' });
	await expect
		.element(dialog.getByRole('alert'))
		.toHaveTextContent('Could not clear saved settings. Try again.');
	settingsApi.setLatency(500);
	await app.user.click(dialog.getByRole('button', { name: 'Clear settings', exact: true }));
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
	expect(document.documentElement.dataset.colorMode).toBeUndefined();
	await act(() => app.router.navigate('/settings/preferences'));
	await expect
		.element(app.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('System');
	await expect.element(app.locator.getByRole('alert')).not.toBeInTheDocument();
	await expect.element(app.locator.getByRole('status')).not.toBeInTheDocument();
	app.unmount();
	const again = await renderApp();
	await expect
		.element(again.locator.getByRole('button', { name: /Theme/ }))
		.toHaveTextContent('System');
});

test('settings pages and portalled dialogs have no axe violations', async () => {
	const app = await renderApp(['/settings/profile']);
	await expect
		.element(app.locator.getByRole('heading', { name: 'Profile', level: 1 }))
		.toBeVisible();
	await expectAccessible(app.container);
	await app.user.click(app.locator.getByRole('textbox', { name: 'Full name' }));
	await expect.element(app.locator.getByRole('textbox', { name: 'Full name' })).toHaveFocus();
	await app.user.click(app.locator.getByRole('button', { name: 'Change email' }));
	await expect.element(page.getByRole('dialog', { name: 'Change email' })).toBeVisible();
	await expectAccessible(app.container);
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

test('partial updates omit undefined fields and reject empty patches', async () => {
	settingsApi.setLatency(0);
	await settingsApi.updateProfile({ displayName: 'Saved Profile' });
	await expect(settingsApi.updateProfile({ title: undefined })).rejects.toMatchObject({
		message: 'No changes to save',
	});
	await expect(settingsApi.updatePreferences({ colorMode: undefined })).rejects.toMatchObject({
		message: 'No changes to save',
	});
	await settingsApi.updateProfile({ title: 'Lead designer', username: undefined });
	await settingsApi.updatePreferences({ fontSize: 'large', colorMode: undefined });
	const settings = await settingsApi.getSettings();
	expect(settings.profile.displayName).toBe('Saved Profile');
	expect(settings.profile.title).toBe('Lead designer');
	expect(settings.profile.username).toBe('boricio');
	expect(settings.preferences.colorMode).toBe('system');
	expect(settings.preferences.fontSize).toBe('large');
});

test('invalid profile data is rejected at the settings API boundary', async () => {
	await expect(settingsApi.updateProfile({ displayName: '' })).rejects.toMatchObject({
		fieldErrors: { displayName: 'Name is required' },
	});
	await expect(settingsApi.updateProfile({ email: 'not-an-email' })).rejects.toMatchObject({
		fieldErrors: { email: expect.any(String) },
	});
	expect((await settingsApi.getSettings()).profile.displayName).toBe('Boricio Jones');
	expect((await settingsApi.getSettings()).profile.email).toBe('boricio@example.com');
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

async function expectDocumentColorMode(mode: string) {
	await expect.poll(() => document.documentElement.dataset.colorMode).toBe(mode);
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
