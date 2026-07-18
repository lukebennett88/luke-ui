import '../../dist/themes/tactile.css';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { Button } from '../button/index.js';
import { ComboboxField } from '../combobox-field/index.js';
import { ComboboxItem } from '../combobox-field/primitive/item.js';
import { IconSpritesheetProvider } from '../icon/index.js';
import { tactileThemeClassName } from '../themes/index.js';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];
const scopes: Array<HTMLElement> = [];

afterEach(async () => {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;
	for (const scope of scopes) scope.remove();
	scopes.length = 0;

	await emulateColorScheme('light');
});

test('selects the system colour mode when no explicit mode exists', async () => {
	const systemScope = renderScope();
	const lightScope = renderScope('light');
	const darkScope = renderScope('dark');

	await emulateColorScheme('light');
	expect(getComputedStyle(systemScope).backgroundColor).toBe(
		getComputedStyle(lightScope).backgroundColor,
	);
	expect(getComputedStyle(systemScope).colorScheme).toBe('light');

	await emulateColorScheme('dark');
	expect(getComputedStyle(systemScope).backgroundColor).toBe(
		getComputedStyle(darkScope).backgroundColor,
	);
	expect(getComputedStyle(systemScope).colorScheme).toBe('dark');
});

test('applies explicit and nested opposite colour modes with native colour-scheme', () => {
	const outer = renderScope('dark');
	const nested = outer.appendChild(document.createElement('div'));
	nested.dataset.colorMode = 'light';
	nested.style.backgroundColor = 'var(--luke-color-surface-canvas)';
	const lightReference = renderScope('light');

	expect(getComputedStyle(outer).colorScheme).toBe('dark');
	expect(getComputedStyle(nested).colorScheme).toBe('light');
	expect(getComputedStyle(nested).backgroundColor).toBe(
		getComputedStyle(lightReference).backgroundColor,
	);
});

test('renders components from static CSS without theme context or injected styles', () => {
	const styleCount = document.querySelectorAll('style').length;
	const scope = renderScope('light');
	const root = createRoot(scope);
	mounted.push({ container: scope, root });

	act(() => root.render(<Button>Continue</Button>));
	const button = page.getByRole('button', { name: 'Continue' }).element();

	expect(getComputedStyle(button).display).toBe('inline-flex');
	expect(document.querySelectorAll('style')).toHaveLength(styleCount);
});

test('preserves identity and an opposite nested mode on a portalled combobox', async () => {
	const outer = renderScope('light');
	const nested = outer.appendChild(document.createElement('div'));
	nested.dataset.colorMode = 'dark';
	const root = createRoot(nested);
	mounted.push({ container: outer, root });

	act(() => {
		root.render(
			<IconSpritesheetProvider href="#icons">
				<ComboboxField
					defaultItems={[{ id: 'au', label: 'Australia' }]}
					label="Country"
					name="country"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</IconSpritesheetProvider>,
		);
	});

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeInTheDocument();

	const portal = document.querySelector('[role="listbox"]')?.parentElement;
	if (!portal) throw new Error('expected the listbox to have a popover parent');

	expect(portal).toHaveAttribute('data-color-mode', 'dark');
	expect(getComputedStyle(portal).colorScheme).toBe('dark');
	const portalCanvas = getComputedStyle(portal).getPropertyValue('--luke-color-surface-canvas');
	expect(portalCanvas).not.toBe('');
	expect(portalCanvas).toBe(
		getComputedStyle(nested).getPropertyValue('--luke-color-surface-canvas'),
	);
});

function renderScope(mode?: 'light' | 'dark') {
	const scope = document.body.appendChild(document.createElement('div'));
	scopes.push(scope);
	scope.className = tactileThemeClassName;
	scope.style.backgroundColor = 'var(--luke-color-surface-canvas)';
	if (mode !== undefined) scope.dataset.colorMode = mode;

	return scope;
}

async function emulateColorScheme(mode: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}
