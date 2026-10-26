import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from '../../../dist/box.js';
import { vars } from '../../theme/contract.css.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import { createSprinkles } from './utilities.css.js';
import type { SprinklesProps } from './utilities.css.js';

type UtilityProps = NonNullable<BoxProps>;

test('exposes the responsive layout and appearance property surface', () => {
	expect(createSprinkles.properties).toContain('display');
	expect(createSprinkles.properties).toContain('gridColumn');
	expect(createSprinkles.properties).toContain('justifyItems');
	expect(createSprinkles.properties).toContain('backgroundColor');
	expect(createSprinkles.properties).toContain('borderColor');
	expect(createSprinkles.properties).toContain('borderWidth');
	expect(createSprinkles.properties).toContain('borderStyle');
	expect(createSprinkles.properties).toContain('borderRadius');
	expect(createSprinkles.properties).not.toContain('color');
	expect(createSprinkles.properties).not.toContain('fontSize');
});

test('resolves borderColor tokens to their theme variables', () => {
	const { style } = createSprinkles({ borderColor: 'focus' });

	expect(Object.values(style ?? {})).toEqual(['var(--luke-color-border-focus)']);
});

// The fill and its foreground context come from one class, never an inline value.
test('gives every resting background its own class and no inline value', () => {
	const tokens = [
		...SEMANTIC_ROLES.flatMap((role) => [`${role}.subtle`, `${role}.solid`] as const),
		...(['base', 'subdued', 'field', 'overlay'] as const).map((surface) => {
			return `surface.${surface}` as const;
		}),
	];

	const classNames = tokens.map((backgroundColor) => {
		assertType<UtilityProps['backgroundColor']>(backgroundColor);
		const { className, style } = createSprinkles({ backgroundColor });
		expect(style).toEqual({});
		return className;
	});

	expect(classNames.every(Boolean)).toBe(true);
	expect(new Set(classNames).size).toBe(tokens.length);
});

test('gives each responsive background condition its own class', () => {
	const initial = createSprinkles({ backgroundColor: 'accent.solid' }).className;
	const responsive = createSprinkles({
		backgroundColor: { initial: 'accent.solid', bp768: 'surface.base', bp1024: null },
	}).className.split(' ');

	expect(responsive).toHaveLength(2);
	expect(responsive[0]).toBe(initial);
	expect(responsive[1]).not.toBe(createSprinkles({ backgroundColor: 'surface.base' }).className);
});

test('an omitted background adds no class', () => {
	expect(createSprinkles({ backgroundColor: undefined }).className).toBe('');
	expect(createSprinkles({ backgroundColor: null }).className).toBe('');
	expect(createSprinkles({ backgroundColor: {} }).className).toBe('');
});

// Box is a second way into the token contract, so its token-backed values follow `vars`.
test('derives token-backed Box values from the public contract', () => {
	const cases = [
		...Object.entries(vars.radius).map(([key, value]) => ['borderRadius', key, value] as const),
		...Object.entries(vars.depth).map(([key, value]) => ['boxShadow', key, value] as const),
		...Object.entries(vars.color.border).map(
			([key, value]) => ['borderColor', key, value] as const,
		),
		...Object.entries(vars.space).map(([key, value]) => ['gap', `space.${key}`, value] as const),
	];

	const mismatched = cases.filter(([property, key, value]) => {
		const { style } = createSprinkles({ [property]: key });
		return !Object.values(style ?? {}).includes(value);
	});
	expect(mismatched).toEqual([]);
});

test('passes through own enumerable string-keyed non-utility props', () => {
	const result = createSprinkles({
		'data-testid': 'box',
		backgroundColor: 'accent.solid',
		display: 'flex',
		id: 'layout-root',
		role: 'group',
	});

	expect(result).toMatchObject({
		'data-testid': 'box',
		id: 'layout-root',
		role: 'group',
	});
	expect(result.className.split(' ')).toEqual(
		expect.arrayContaining([
			createSprinkles({ display: 'flex' }).className,
			createSprinkles({ backgroundColor: 'accent.solid' }).className,
		]),
	);
	expect('display' in result).toBe(false);
	expect('backgroundColor' in result).toBe(false);
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
	assertType<UtilityProps['backgroundColor']>('magenta.solid');
	// @ts-expect-error — Box exposes the resting fill only
	assertType<UtilityProps['backgroundColor']>('accent.solid.rest');
	// @ts-expect-error — interaction states stay recipe tokens
	assertType<UtilityProps['backgroundColor']>('accent.subtle.rest');
	// @ts-expect-error — interaction states stay recipe tokens
	assertType<UtilityProps['backgroundColor']>('danger.solid.pressed');
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

test('alignment props accept start and end, which grid alignment uses', () => {
	expectTypeOf<'start'>().toExtend<UtilityProps['alignItems']>();
	expectTypeOf<'end'>().toExtend<UtilityProps['alignItems']>();
	expectTypeOf<'start'>().toExtend<UtilityProps['justifyItems']>();
	expectTypeOf<'end'>().toExtend<UtilityProps['justifyItems']>();
	expectTypeOf<'start'>().toExtend<UtilityProps['alignContent']>();
	expectTypeOf<'end'>().toExtend<UtilityProps['alignContent']>();
	expectTypeOf<'start'>().toExtend<UtilityProps['justifyContent']>();
	expectTypeOf<'end'>().toExtend<UtilityProps['justifyContent']>();
});

test('responsive objects reject unknown breakpoints and off-scale values', () => {
	// @ts-expect-error — not a breakpoint
	assertType<UtilityProps['padding']>({ initial: 'space.4', tablet: 'space.16' });
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

test('createSprinkles.properties is a read-only Set contract', () => {
	expectTypeOf(createSprinkles.properties).toEqualTypeOf<ReadonlySet<keyof SprinklesProps>>();
	// @ts-expect-error — the type is read-only; mutation APIs are not part of the contract
	createSprinkles.properties.add('display');
});

test('createSprinkles keeps non-utility props on the result and consumes the utility ones', () => {
	const result = createSprinkles({
		'data-testid': 'box',
		backgroundColor: 'surface.base',
		display: 'flex',
		id: 'root',
	});
	expectTypeOf(result).not.toHaveProperty('display');
	expectTypeOf(result).not.toHaveProperty('backgroundColor');
	expect(Object.hasOwn(result, 'display')).toBe(false);
	expect(result.id).toBe('root');
});

test('spacing props keep namespaced tokens and string zero without arbitrary lengths', () => {
	assertType<UtilityProps>({
		padding: { initial: 'space.4', bp768: 'space.16' },
		margin: 'auto',
		gap: '0',
	});
	// @ts-expect-error — spacing lengths belong in CSS
	assertType<UtilityProps>({ padding: '1rem' });
	// @ts-expect-error — zero is a string token
	assertType<UtilityProps>({ gap: 0 });
	// @ts-expect-error — zero is outside the spacing namespace
	assertType<UtilityProps>({ gap: 'space.0' });
	// @ts-expect-error — the variable key alone is not a public spacing value
	assertType<UtilityProps>({ gap: '16' });
	// @ts-expect-error — only curated spacing steps are supported
	assertType<UtilityProps>({ padding: 'space.20' });
	// @ts-expect-error — spacing tokens use the public namespace
	assertType<UtilityProps>({ padding: 'sp16' });
});
