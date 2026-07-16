import { expect, test } from 'vite-plus/test';
import { paperThemeClassName, tactileThemeClassName } from '../themes/index.js';
import { cleanupVisual, renderVisual, visualAppearances } from './render-visual.js';

test('renders every bundled identity and explicit colour mode independently', () => {
	for (const appearance of visualAppearances) {
		const scene = renderVisual(<span>Theme contract</span>, appearance);
		const root = scene.element();

		expect(root).toHaveClass(
			appearance.theme === 'tactile' ? tactileThemeClassName : paperThemeClassName,
		);
		expect(root).toHaveAttribute('data-color-mode', appearance.mode);
		const styles = getComputedStyle(root);
		expect(styles.colorScheme).toBe(appearance.mode);
		expect(styles.backgroundColor).toBe(styles.getPropertyValue('--luke-color-surface-canvas'));

		cleanupVisual();
	}
});

test('defaults existing callers to Tactile light', () => {
	const root = renderVisual(<span>Default contract</span>).element();

	expect(root).toHaveClass(tactileThemeClassName);
	expect(root).toHaveAttribute('data-color-mode', 'light');
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
