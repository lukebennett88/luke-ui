import { expect, test } from 'vite-plus/test';
import { themeClassName as paperThemeClassName } from '../themes/paper/index.js';
import { themeClassName as tactileThemeClassName } from '../themes/tactile/index.js';
import { cleanupVisual, renderVisual, visualAppearances } from './render-visual.js';

test('renders every bundled identity and explicit colour mode independently', () => {
	for (const appearance of visualAppearances) {
		const scene = renderVisual(<span>Theme contract</span>, appearance);
		const root = scene.element();

		expect(document.documentElement).toHaveClass(
			appearance.theme === 'tactile' ? tactileThemeClassName : paperThemeClassName,
		);
		expect(document.documentElement).toHaveAttribute('data-color-mode', appearance.mode);
		const styles = getComputedStyle(root);
		expect(styles.colorScheme).toBe(appearance.mode);
		expect(styles.backgroundColor).toBe(styles.getPropertyValue('--luke-color-surface-canvas'));

		cleanupVisual();
	}
});

test('defaults existing callers to Tactile light', () => {
	renderVisual(<span>Default contract</span>);

	expect(document.documentElement).toHaveClass(tactileThemeClassName);
	expect(document.documentElement).toHaveAttribute('data-color-mode', 'light');
});

test('allows a nested scope to select the opposite colour mode', () => {
	const scene = renderVisual(<div data-color-mode="light">Nested contract</div>, {
		mode: 'dark',
		theme: 'paper',
	});
	const nestedScope = scene.getByText('Nested contract').element();

	expect(getComputedStyle(scene.element()).colorScheme).toBe('dark');
	expect(getComputedStyle(nestedScope).colorScheme).toBe('light');
});
