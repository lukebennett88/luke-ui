import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from '../../../dist/box.js';
import { vars } from '../../theme/contract.css.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import { containerMaxInlineSizeTokens } from './container-tokens.js';
import { createSprinkles } from './utilities.css.js';
import type { GridPlacementSprinklesProps, SprinklesProps } from './utilities.css.js';

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
	// Consumers state grow, shrink, and basis separately. There is no hidden shorthand.
	expect(createSprinkles.properties).not.toContain('flex');
});

test('resolves borderColor tokens to their theme variables', () => {
	const { style } = createSprinkles({ borderColor: 'control' });

	expect(Object.values(style ?? {})).toEqual(['var(--luke-color-border-control-rest)']);
});

test('rejects state-specific control borders and the removed string leaf', () => {
	// @ts-expect-error — borderColor values are state-free, so control.hover is not accepted
	createSprinkles({ borderColor: 'control.hover' });
	// @ts-expect-error — borderColor values are state-free, so control.rest is not an alias
	createSprinkles({ borderColor: 'control.rest' });
	// @ts-expect-error — borderColor values are state-free, so control.pressed is not accepted
	createSprinkles({ borderColor: 'control.pressed' });
	// @ts-expect-error — border.control is a group of state leaves, not a string
	const removedLeaf: string = vars.color.border.control;

	expect(removedLeaf).toBeDefined();
});

test('rejects the standalone focus colour as a borderColor', () => {
	// @ts-expect-error — focus is a standalone colour, not a border colour
	const { style } = createSprinkles({ borderColor: 'focus' });

	expect(style).not.toHaveProperty('borderColor', 'var(--luke-color-focus)');
});

// The fill and its foreground context come from one class, never an inline value.
test('gives every resting background its own class and no inline value', () => {
	const tokens = [
		...SEMANTIC_ROLES.flatMap((role) => [`${role}.subtle`, `${role}.solid`] as const),
		...(['base', 'subdued', 'raised'] as const).map((surface) => {
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
		...Object.entries(vars.shadow).map(([key, value]) => ['boxShadow', key, value] as const),
		['borderColor', 'control', vars.color.border.control.rest] as const,
		['borderColor', 'decorative', vars.color.border.decorative] as const,
		...SEMANTIC_ROLES.flatMap((role) => {
			return [['borderColor', `${role}.strong`, vars.color.border[role].strong]] as const;
		}),
		...Object.entries(vars.space).map(([key, value]) => ['gap', `space.${key}`, value] as const),
		...Object.entries(vars.space).map(
			([key, value]) => ['insetBlockEnd', `space.${key}`, value] as const,
		),
		...Object.entries(containerMaxInlineSizeTokens).map(
			([key, value]) => ['maxInlineSize', key, value] as const,
		),
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
		maxInlineSize: 'container.448',
		style: { color: 'red' },
	});

	expect(result.className).not.toContain('consumer-class');
	expect(result.className.length).toBeGreaterThan(0);
	expect(result.style).not.toEqual({ color: 'red' });
	expect(Object.values(result.style)).toContain('28rem');
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
	// Box values are state-free: `accent.solid` paints `vars.color.background.accent.solid.rest`.
	assertType<UtilityProps['backgroundColor']>('accent.solid');
	assertType<UtilityProps['backgroundColor']>('accent.subtle');
	// @ts-expect-error — `.rest` is not a Box alias for the resting solid fill
	assertType<UtilityProps['backgroundColor']>('accent.solid.rest');
	// @ts-expect-error — subtle has no state leaves
	assertType<UtilityProps['backgroundColor']>('accent.subtle.rest');
	// @ts-expect-error — interaction states stay recipe tokens
	assertType<UtilityProps['backgroundColor']>('danger.solid.hover');
	// @ts-expect-error — interaction states stay recipe tokens
	assertType<UtilityProps['backgroundColor']>('danger.solid.pressed');
	// @ts-expect-error — backdrop is not an opaque surface fill
	assertType<UtilityProps['backgroundColor']>('backdrop');
	// @ts-expect-error — skeleton is not a Box value
	assertType<UtilityProps['backgroundColor']>('skeleton');
	// @ts-expect-error — a translucent scrim is not an opaque surface fill
	assertType<UtilityProps['backgroundColor']>('overlay.backdrop');
	// @ts-expect-error — surfaces are namespaced, so the bare name must not assign
	assertType<UtilityProps['backgroundColor']>('canvas');
});

test('border props reject CSS values outside the design system vocabulary', () => {
	assertType<UtilityProps['borderWidth']>('none');
	assertType<UtilityProps['borderWidth']>('thin');
	assertType<UtilityProps['borderWidth']>('thick');
	// @ts-expect-error — numeric border tokens are not supported
	assertType<UtilityProps['borderWidth']>('border.1');
	// @ts-expect-error — numeric border tokens are not supported
	assertType<UtilityProps['borderWidth']>('border.2');
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

test('sizing props reject lengths, tokens, and numbers', () => {
	expectTypeOf<UtilityProps['inlineSize']>().not.toBeAny();
	// @ts-expect-error — a space token is not a size
	assertType<UtilityProps['inlineSize']>('space.32');
	// @ts-expect-error — the historical spacing name compiled to invalid CSS
	assertType<UtilityProps['inlineSize']>('sp32');
	// @ts-expect-error — arbitrary lengths use style or className
	assertType<UtilityProps['inlineSize']>('42rem');
	// @ts-expect-error — container presets are maximum inline sizes only
	assertType<UtilityProps['inlineSize']>('container.672');
	// @ts-expect-error — zero is the string "0"
	assertType<UtilityProps['minInlineSize']>(0);
	// @ts-expect-error — arbitrary lengths use style or className
	assertType<UtilityProps['minBlockSize']>('4rem');
	// @ts-expect-error — a space token is not a size
	assertType<UtilityProps['blockSize']>('space.16');
	// @ts-expect-error — functions are not utility values
	assertType<UtilityProps['blockSize']>('calc(100% - 1rem)');
	// @ts-expect-error — container presets are inline only
	assertType<UtilityProps['maxBlockSize']>('container.672');
	// @ts-expect-error — maximum sizes use none, not auto
	assertType<UtilityProps['maxInlineSize']>('auto');
	// @ts-expect-error — maximum sizes use none, not auto
	assertType<UtilityProps['maxBlockSize']>('auto');
	// @ts-expect-error — none is a maximum-size keyword
	assertType<UtilityProps['minInlineSize']>('none');
	// @ts-expect-error — booleans are not size values
	assertType<UtilityProps['inlineSize']>(true);
	// @ts-expect-error — the value must still be a supported keyword at every breakpoint
	assertType<UtilityProps['inlineSize']>({ initial: '100%', bp768: '42rem' });
});

test('sizing props accept keywords, string zero, and responsive values', () => {
	for (const value of ['0', 'auto', '100%', 'min-content', 'max-content', 'fit-content'] as const) {
		assertType<UtilityProps['inlineSize']>(value);
		assertType<UtilityProps['blockSize']>(value);
		assertType<UtilityProps['minInlineSize']>(value);
		assertType<UtilityProps['minBlockSize']>(value);
	}
	for (const value of ['0', 'none', '100%', 'min-content', 'max-content', 'fit-content'] as const) {
		assertType<UtilityProps['maxInlineSize']>(value);
		assertType<UtilityProps['maxBlockSize']>(value);
	}
	expectTypeOf<
		'container.448' | 'container.672' | 'container.896' | 'container.1152' | 'container.1280'
	>().toExtend<UtilityProps['maxInlineSize']>();
	assertType<UtilityProps['maxInlineSize']>({ initial: '100%', bp768: 'container.672' });
	assertType<UtilityProps['inlineSize']>({ initial: '100%', bp1024: 'auto' });
});

test('insets accept space tokens, zero, and auto only', () => {
	assertType<UtilityProps['inset']>('0');
	assertType<UtilityProps['insetBlockEnd']>('space.8');
	assertType<UtilityProps['insetInlineStart']>('auto');
	assertType<UtilityProps['insetBlock']>({ initial: 'space.4', bp768: 'space.16' });
	// @ts-expect-error — percentages are not inset values
	assertType<UtilityProps['inset']>('50%');
	// @ts-expect-error — percentages are not inset values
	assertType<UtilityProps['insetInlineStart']>('50%');
	// @ts-expect-error — arbitrary lengths are not inset values
	assertType<UtilityProps['insetInline']>('1rem');
	// @ts-expect-error — negative values are not inset values
	assertType<UtilityProps['insetInlineEnd']>('-1rem');
	// @ts-expect-error — zero is the string "0"
	assertType<UtilityProps['insetBlockStart']>(0);
});

test('flex shorthand is removed in favour of grow, shrink, and basis', () => {
	expectTypeOf<UtilityProps>().not.toHaveProperty('flex');
	// @ts-expect-error — use flexGrow, flexShrink, and flexBasis
	assertType<UtilityProps>({ flex: 1 });
	// @ts-expect-error — use flexGrow, flexShrink, and flexBasis
	assertType<UtilityProps>({ flex: '1' });
	// @ts-expect-error — use flexGrow, flexShrink, and flexBasis
	assertType<UtilityProps>({ flex: 'auto' });
	assertType<UtilityProps>({ flexBasis: '0', flexGrow: '1', flexShrink: '0' });
	assertType<UtilityProps['flexGrow']>({ initial: '0', bp768: '1' });
});

test('flexBasis accepts the base sizes plus content', () => {
	for (const value of [
		'0',
		'auto',
		'100%',
		'min-content',
		'max-content',
		'fit-content',
		'content',
	] as const) {
		assertType<UtilityProps['flexBasis']>(value);
	}
	// @ts-expect-error — container presets are maximum inline sizes only
	assertType<UtilityProps['flexBasis']>('container.672');
	// @ts-expect-error — none is a maximum-size keyword
	assertType<UtilityProps['flexBasis']>('none');
	// @ts-expect-error — arbitrary lengths use style or className
	assertType<UtilityProps['flexBasis']>('14rem');
	// @ts-expect-error — zero is the string "0"
	assertType<UtilityProps['flexBasis']>(0);
	// @ts-expect-error — flexGrow takes string keywords
	assertType<UtilityProps['flexGrow']>(1);
});

test('order accepts numbers only', () => {
	assertType<UtilityProps['order']>(0);
	assertType<UtilityProps['order']>(-1);
	assertType<UtilityProps['order']>({ initial: 2, bp768: 0 });
	// @ts-expect-error — order is numeric
	assertType<UtilityProps['order']>('space.32');
	// @ts-expect-error — order is numeric
	assertType<UtilityProps['order']>('1');
	// @ts-expect-error — booleans are not order values
	assertType<UtilityProps['order']>(true);
});

test('createSprinkles.properties is a read-only Set contract', () => {
	expectTypeOf(createSprinkles.properties).toEqualTypeOf<
		ReadonlySet<keyof SprinklesProps | keyof GridPlacementSprinklesProps>
	>();
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

test('logical border widths accept only the responsive border scale', () => {
	assertType<UtilityProps>({
		borderBlockStartWidth: { initial: 'thin', bp768: 'thick' },
		borderBlockEndWidth: 'none',
		borderInlineStartWidth: { bp768: 'thin', bp1024: 'none' },
		borderInlineEndWidth: 'thick',
	});
	// @ts-expect-error — arbitrary lengths are not supported
	assertType<UtilityProps>({ borderBlockStartWidth: '1px' });
	// @ts-expect-error — physical sides are not supported
	assertType<UtilityProps>({ borderLeftWidth: 'thin' });
	// @ts-expect-error — logical axis shorthands are not supported
	assertType<UtilityProps>({ borderInlineWidth: 'thin' });
});

test('overscrollBehavior accepts auto and contain, responsively', () => {
	assertType<UtilityProps>({ overscrollBehavior: 'contain' });
	assertType<UtilityProps>({ overscrollBehavior: { initial: 'auto', bp768: 'contain' } });
	// @ts-expect-error — scroll chaining keywords other than auto and contain are not supported
	assertType<UtilityProps>({ overscrollBehavior: 'none' });
	// @ts-expect-error — scroll is not an overscroll behaviour
	assertType<UtilityProps>({ overscrollBehavior: 'scroll' });
	expect(createSprinkles.properties).toContain('overscrollBehavior');
});

test('listStyle accepts only a single none value', () => {
	assertType<UtilityProps>({ listStyle: 'none' });
	// @ts-expect-error — other list styles are not supported
	assertType<UtilityProps>({ listStyle: 'disc' });
	// @ts-expect-error — listStyle has no responsive values
	assertType<UtilityProps>({ listStyle: { initial: 'none' } });
	expect(createSprinkles({ listStyle: 'none' }).className).not.toBe('');
});
