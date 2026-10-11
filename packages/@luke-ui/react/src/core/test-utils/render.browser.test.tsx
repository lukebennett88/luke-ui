import { expect, test } from 'vite-plus/test';
import { fixtureThemeClassName } from './fixture-themes.js';
import { cleanupMountedRenders } from './render-mount-state.js';
import { render, visualAppearances } from './render.js';

test('renders every fixture identity and explicit colour mode independently', () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<span>Theme contract</span>, { appearance });
		const root = locator.element();

		expect(document.documentElement).toHaveClass(fixtureThemeClassName(appearance.theme));
		expect(document.documentElement).toHaveAttribute('data-color-mode', appearance.mode);
		const styles = getComputedStyle(root);
		expect(styles.colorScheme).toBe(appearance.mode);
		// The shared stylesheet paints <body>, so the render needs no background of its own.
		expect(getComputedStyle(document.body).backgroundColor).toBe(
			styles.getPropertyValue('--luke-color-surface-base'),
		);
	}
});

test('defaults existing callers to Tactile light', () => {
	render(<span>Default contract</span>);

	expect(document.documentElement).toHaveClass('luke-ui-theme-tactile');
	expect(document.documentElement).toHaveAttribute('data-color-mode', 'light');
});

test('allows a nested scope to select the opposite colour mode', () => {
	const { locator } = render(<div data-color-mode="light">Nested contract</div>, {
		appearance: { mode: 'dark', theme: 'paper' },
	});
	const nestedScope = locator.getByText('Nested contract').element();

	expect(getComputedStyle(locator.element()).colorScheme).toBe('dark');
	expect(getComputedStyle(nestedScope).colorScheme).toBe('light');
});

test('does not clean up an individually unmounted render twice', () => {
	const { container, unmount } = render(<span>Unmount contract</span>);

	unmount();
	expect(container).not.toBeInTheDocument();
	expect(() => cleanupMountedRenders()).not.toThrow();
});
