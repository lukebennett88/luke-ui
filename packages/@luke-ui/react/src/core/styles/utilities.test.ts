import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from '../../../dist/box.js';
import type { SprinklesProps } from '../../../dist/styles.js';
import { createSprinkles as createPublicSprinkles } from '../../../dist/styles.js';
import { createSprinkles } from './utilities.css.js';

type UtilityProps = NonNullable<BoxProps>;

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
	const { style } = createSprinkles({
		backgroundColor: 'accent.solid.rest',
		borderColor: 'focus',
	});

	// An unregistered token still yields a class, with the raw string assigned as the custom
	// property value, so the contract is the `var(--luke-*)` references.
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

test('passes through own enumerable string-keyed non-utility props', () => {
	const result = createSprinkles({
		'data-testid': 'box',
		display: 'flex',
		id: 'layout-root',
		role: 'group',
	});

	expect(result).toMatchObject({
		'data-testid': 'box',
		id: 'layout-root',
		role: 'group',
	});
	expect(result.className.length).toBeGreaterThan(0);
	expect('display' in result).toBe(false);
});

test('replaces input className and style with generated output', () => {
	const result = createSprinkles({
		className: 'consumer-class',
		display: 'grid',
		inlineSize: '20rem',
		style: { color: 'red' },
	});

	expect(result.className).not.toContain('consumer-class');
	expect(result.className.length).toBeGreaterThan(0);
	expect(result.style).not.toEqual({ color: 'red' });
	expect(Object.values(result.style)).toContain('20rem');
});

test('does not claim to preserve symbol keys or non-enumerable props', () => {
	const symbolKey = Symbol('hidden');
	const input = Object.defineProperties(
		{ display: 'flex' as const },
		{
			[symbolKey]: { enumerable: true, value: 'symbol-value' },
			secret: { enumerable: false, value: 'hidden' },
		},
	);

	const result = createSprinkles(input);

	expect(result).not.toHaveProperty('secret');
	expect(Object.getOwnPropertySymbols(result)).toEqual([]);
});

test('spacing scales reject raw CSS lengths and numbers', () => {
	expectTypeOf<UtilityProps['gap']>().not.toBeAny();
	// @ts-expect-error — a raw CSS length is not a spacing key
	assertType<UtilityProps['gap']>('16px');
	// @ts-expect-error — spacing keys are strings, so a number must not assign
	assertType<UtilityProps['gap']>(16);
	// @ts-expect-error — `auto` belongs to margin only, not padding
	assertType<UtilityProps['paddingInline']>('auto');
});

test('backgroundColor rejects anything but a namespaced role or surface token', () => {
	expectTypeOf<UtilityProps['backgroundColor']>().not.toBeAny();
	// @ts-expect-error — not a token, and would be allowed by a widened `Record<string, string>`
	assertType<UtilityProps['backgroundColor']>('rebeccapurple');
	// @ts-expect-error — unknown role
	assertType<UtilityProps['backgroundColor']>('magenta.solid.rest');
	// @ts-expect-error — unknown state
	assertType<UtilityProps['backgroundColor']>('accent.solid.disabled');
	// @ts-expect-error — a translucent scrim is not an opaque surface fill
	assertType<UtilityProps['backgroundColor']>('overlay.backdrop');
	// @ts-expect-error — surfaces are namespaced, so the bare name must not assign
	assertType<UtilityProps['backgroundColor']>('canvas');
});

test('border props reject CSS values outside the design system vocabulary', () => {
	// @ts-expect-error — CSS-wide keyword
	assertType<UtilityProps['borderWidth']>('revert-layer');
	// @ts-expect-error — a raw length, not one of the named widths
	assertType<UtilityProps['borderWidth']>('1px');
	// @ts-expect-error — `medium` is a CSS keyword width, not a token
	assertType<UtilityProps['borderWidth']>('medium');
	// @ts-expect-error — a style the design system does not offer
	assertType<UtilityProps['borderStyle']>('groove');
});

test('responsive objects reject unknown breakpoints and off-scale values', () => {
	// @ts-expect-error — not a breakpoint
	assertType<UtilityProps['padding']>({ initial: 'sp4', tablet: 'sp16' });
	// @ts-expect-error — the value must still be a space step at every breakpoint
	assertType<UtilityProps['padding']>({ initial: '16px' });
});

test('unconstrained properties keep property-specific CSS value typing', () => {
	// @ts-expect-error — booleans are not CSS size values
	assertType<UtilityProps['inlineSize']>(true);
	// @ts-expect-error — plain objects are not CSS size values
	assertType<UtilityProps['inlineSize']>({ bogus: '1px' });
	// @ts-expect-error — booleans are not CSS order values
	assertType<UtilityProps['order']>(true);
	// @ts-expect-error — booleans are not CSS flex values
	assertType<UtilityProps['flex']>(false);
});

test('createSprinkles.properties is a read-only public Set contract', () => {
	expectTypeOf(createPublicSprinkles.properties).toEqualTypeOf<ReadonlySet<keyof SprinklesProps>>();
	// @ts-expect-error — the public type is read-only; mutation APIs are not part of the contract
	createPublicSprinkles.properties.add('display');
});

test('createSprinkles keeps non-utility props on the result and consumes the utility ones', () => {
	const result = createPublicSprinkles({ 'data-testid': 'box', display: 'flex', id: 'root' });
	expectTypeOf(result).not.toHaveProperty('display');
	expect(Object.hasOwn(result, 'display')).toBe(false);
	expect(result.id).toBe('root');
});
