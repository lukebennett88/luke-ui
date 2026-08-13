import '../../dist/themes/tactile/stylesheet.css';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { Button } from '../button/index.js';
import { ComboboxField } from '../combobox-field/index.js';
import { IconSpritesheetProvider } from '../icon/index.js';
import { ComboboxItem } from '../primitives/combobox/item.js';
import { themeClassName as tactileThemeClassName } from '../themes/tactile/index.js';

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

	document.documentElement.removeAttribute('data-color-mode');
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

	expect(document.querySelectorAll('style')).toHaveLength(styleCount);
});

// Portal theme propagation was deliberately removed: importing a theme stylesheet themes the
// whole document from `:root`, so a body-level portal inherits it with no JS or class needed.
async function openPortalledCombobox(mountTarget: HTMLElement) {
	const root = createRoot(mountTarget);
	mounted.push({ container: mountTarget, root });

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

	return portal;
}

test('a portalled combobox follows a colour mode set on the document', async () => {
	document.documentElement.dataset.colorMode = 'dark';

	const outer = renderScope('light');
	const portal = await openPortalledCombobox(outer);

	expect(getComputedStyle(portal).colorScheme).toBe('dark');
	const portalCanvas = getComputedStyle(portal).getPropertyValue('--luke-color-surface-canvas');
	expect(portalCanvas).not.toBe('');
	expect(portalCanvas).toBe(
		getComputedStyle(document.documentElement).getPropertyValue('--luke-color-surface-canvas'),
	);
});

test('a colour mode scoped to a nested div does not reach a portalled combobox (propagation removed by design)', async () => {
	const outer = renderScope('light');
	const nested = outer.appendChild(document.createElement('div'));
	nested.dataset.colorMode = 'dark';

	const portal = await openPortalledCombobox(nested);

	// The nested div's dark mode stays local to that subtree. The document carries no explicit
	// mode, so the portal resolves the system preference instead, not the nested div's mode.
	expect(portal).not.toHaveAttribute('data-color-mode');
	expect(getComputedStyle(portal).colorScheme).not.toBe('dark');
	const portalCanvas = getComputedStyle(portal).getPropertyValue('--luke-color-surface-canvas');
	expect(portalCanvas).toBe(
		getComputedStyle(document.documentElement).getPropertyValue('--luke-color-surface-canvas'),
	);
	expect(portalCanvas).not.toBe(
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
