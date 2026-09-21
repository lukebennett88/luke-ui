/**
 * Compile-time guards on the utility prop types package consumers see.
 *
 * These read `BoxProps` and `SprinklesProps` from `dist/`, so they check what was published rather
 * than what source happens to infer. Only rejections are kept: the failure mode worth guarding is a
 * scale widening to `string`, `true`, or an index signature, which keeps every valid call
 * compiling while silently accepting raw CSS. `utilities-emitted.test.ts` covers the same surface
 * from the other side, by grepping the emitted declaration text.
 *
 * Run `pnpm run build` first — a stale `dist/` makes these assertions meaningless.
 */

import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from '../../../dist/box.js';
import type { SprinklesProps } from '../../../dist/styles.js';
import { createSprinkles } from '../../../dist/styles.js';

type UtilityProps = NonNullable<BoxProps>;

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
	// Each of these would be accepted if the property were declared `true`.
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
	// `inlineSize`, `order`, and `flex` are `true` scales: they take that property's csstype value,
	// not a widened `string | number`.
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
	expectTypeOf(createSprinkles.properties).toEqualTypeOf<ReadonlySet<keyof SprinklesProps>>();
	// @ts-expect-error — the public type is read-only; mutation APIs are not part of the contract
	createSprinkles.properties.add('display');
});

test('createSprinkles keeps non-utility props on the result and consumes the utility ones', () => {
	const result = createSprinkles({ display: 'flex', id: 'root', 'data-testid': 'box' });
	expectTypeOf(result).not.toHaveProperty('display');
	expect(Object.hasOwn(result, 'display')).toBe(false);
	expect(result.id).toBe('root');
});
