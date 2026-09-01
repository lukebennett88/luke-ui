import { expect, test } from 'vite-plus/test';
import { themeClassName as paperThemeClassName } from '../../theme/bundles/paper/index.js';
import { themeClassName as tactileThemeClassName } from '../../theme/bundles/tactile/index.js';
import { cleanupMountedRenders } from './render-mount-state.js';
import { render, visualAppearances } from './render.js';

test('renders every bundled identity and explicit colour mode independently', () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<span>Theme contract</span>, { appearance });
		const root = locator.element();

		expect(document.documentElement).toHaveClass(
			appearance.theme === 'tactile' ? tactileThemeClassName : paperThemeClassName,
		);
		expect(document.documentElement).toHaveAttribute('data-color-mode', appearance.mode);
		const styles = getComputedStyle(root);
		expect(styles.colorScheme).toBe(appearance.mode);
		expect(styles.backgroundColor).toBe(styles.getPropertyValue('--luke-color-surface-canvas'));
	}
});

test('defaults existing callers to Tactile light', () => {
	render(<span>Default contract</span>);

	expect(document.documentElement).toHaveClass(tactileThemeClassName);
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
