import { expect, test } from 'vite-plus/test';
import { createSprinkles } from './utilities.css.js';

test('exposes the responsive layout and appearance property surface', () => {
	expect(createSprinkles.properties).toContain('display');
	expect(createSprinkles.properties).toContain('gridColumn');
	expect(createSprinkles.properties).toContain('backgroundColor');
	expect(createSprinkles.properties).toContain('borderColor');
	expect(createSprinkles.properties).toContain('borderWidth');
	expect(createSprinkles.properties).toContain('borderStyle');
	expect(createSprinkles.properties).toContain('borderRadius');
	expect(createSprinkles.properties).not.toContain('color');
	expect(createSprinkles.properties).not.toContain('fontSize');
});

test('resolves backgroundColor and borderColor tokens to their theme variables', () => {
	const { className, style } = createSprinkles({
		backgroundColor: 'accent.solid.rest',
		borderColor: 'focus',
	});

	expect(className).toBeTruthy();
	// Asserting the `var(--luke-*)` references rather than mere truthiness: an unregistered token
	// still yields a class, with the raw string assigned as the custom property value.
	expect(Object.values(style ?? {}).sort()).toEqual([
		'var(--luke-color-background-accent-solid-rest)',
		'var(--luke-color-border-focus)',
	]);
});

// Surfaces are opaque backgrounds for cards and panels. The translucent scrim is excluded.
test('resolves every elevation surface background token to its theme variable', () => {
	const surfaces = ['canvas', 'recessed', 'floating', 'overlay'] as const;

	// A missing token still returns a class with the raw string, so assert the generated variable.
	const resolved = surfaces.map((surface) => {
		const { style } = createSprinkles({ backgroundColor: `surface.${surface}` });
		return [surface, Object.values(style ?? {})] as const;
	});

	expect(Object.fromEntries(resolved)).toEqual({
		canvas: ['var(--luke-color-surface-canvas)'],
		floating: ['var(--luke-color-surface-floating)'],
		overlay: ['var(--luke-color-surface-overlay)'],
		recessed: ['var(--luke-color-surface-recessed)'],
	});
});
