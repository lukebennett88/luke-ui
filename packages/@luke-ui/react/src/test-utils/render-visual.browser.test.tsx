import { expect, test } from 'vite-plus/test';
import { elmoThemeClassName, machinedEdgeThemeClassName } from '../themes/index.js';
import { cleanupVisual, renderVisual, visualAppearances } from './render-visual.js';

test('renders every bundled identity and explicit colour mode independently', () => {
	for (const appearance of visualAppearances) {
		const scene = renderVisual(<span>Theme contract</span>, appearance);
		const root = scene.element();

		expect(root).toHaveClass(
			appearance.theme === 'machined-edge' ? machinedEdgeThemeClassName : elmoThemeClassName,
		);
		expect(root).toHaveAttribute('data-color-mode', appearance.mode);
		expect(getComputedStyle(root).colorScheme).toBe(appearance.mode);

		cleanupVisual();
	}
});

test('defaults existing callers to Machined edge light', () => {
	const root = renderVisual(<span>Default contract</span>).element();

	expect(root).toHaveClass(machinedEdgeThemeClassName);
	expect(root).toHaveAttribute('data-color-mode', 'light');
});

test('allows a nested scope to select the opposite colour mode', () => {
	const scene = renderVisual(<div data-color-mode="light">Nested contract</div>, {
		mode: 'dark',
		theme: 'elmo',
	});
	const nestedScope = scene.getByText('Nested contract').element();

	expect(getComputedStyle(scene.element()).colorScheme).toBe('dark');
	expect(getComputedStyle(nestedScope).colorScheme).toBe('light');
});
