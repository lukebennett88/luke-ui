/** Type-level assertions against the utility props emitted for package consumers. */

import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from '../../../dist/box.js';
import type { CreateSprinkles, SprinklesProps } from '../../../dist/styles.js';
import { createSprinkles } from '../../../dist/styles.js';

type UtilityProps = NonNullable<BoxProps>;

test('spacing utilities accept spacing keys and zero', () => {
	expectTypeOf<'sp16'>().toExtend<UtilityProps['gap']>();
	expectTypeOf<'0'>().toExtend<UtilityProps['padding']>();
	expectTypeOf<'sp64'>().toExtend<UtilityProps['marginBlock']>();
	expectTypeOf<UtilityProps['gap']>().not.toBeAny();

	assertType<UtilityProps['gap']>('sp16');
	// @ts-expect-error — a raw CSS length is not a spacing key
	assertType<UtilityProps['gap']>('16px');
	// @ts-expect-error — spacing keys are strings, so a number must not assign
	assertType<UtilityProps['gap']>(16);
});

test('margin keeps auto alongside the space steps', () => {
	assertType<UtilityProps['marginInline']>('auto');
	// @ts-expect-error — `auto` belongs to margin only, not padding
	assertType<UtilityProps['paddingInline']>('auto');
});

test('backgroundColor accepts only role tokens', () => {
	expectTypeOf<UtilityProps['backgroundColor']>().not.toBeAny();
	assertType<UtilityProps['backgroundColor']>('accent.solid.rest');
	assertType<UtilityProps['backgroundColor']>('neutral.subtle.pressed');

	// @ts-expect-error — not a token, and would be allowed by a widened `Record<string, string>`
	assertType<UtilityProps['backgroundColor']>('rebeccapurple');
	// @ts-expect-error — unknown role
	assertType<UtilityProps['backgroundColor']>('magenta.solid.rest');
	// @ts-expect-error — unknown state
	assertType<UtilityProps['backgroundColor']>('accent.solid.disabled');
});

test('backgroundColor offers the elevation surfaces', () => {
	assertType<UtilityProps['backgroundColor']>('surface.canvas');
	assertType<UtilityProps['backgroundColor']>('surface.recessed');
	assertType<UtilityProps['backgroundColor']>('surface.floating');
	assertType<UtilityProps['backgroundColor']>('surface.overlay');

	// @ts-expect-error — a translucent scrim is not an opaque surface fill
	assertType<UtilityProps['backgroundColor']>('overlay.backdrop');
	// @ts-expect-error — surfaces are namespaced, so the bare name must not assign
	assertType<UtilityProps['backgroundColor']>('canvas');
});

test('border props stay constrained to the design system vocabulary', () => {
	assertType<UtilityProps['borderWidth']>('none');
	assertType<UtilityProps['borderWidth']>('thin');
	assertType<UtilityProps['borderWidth']>('thick');
	assertType<UtilityProps['borderStyle']>('solid');
	assertType<UtilityProps['borderColor']>('focus');
	assertType<UtilityProps['borderRadius']>('control');

	// These values would be accepted if the properties were declared `true`.
	// @ts-expect-error — CSS-wide keyword
	assertType<UtilityProps['borderWidth']>('revert-layer');
	// @ts-expect-error — a raw length, not one of the named widths
	assertType<UtilityProps['borderWidth']>('1px');
	// @ts-expect-error — `medium` is a CSS keyword width, not a token
	assertType<UtilityProps['borderWidth']>('medium');
	// @ts-expect-error — a style the design system does not offer
	assertType<UtilityProps['borderStyle']>('groove');
});

test('responsive objects are keyed by the theme breakpoints', () => {
	assertType<UtilityProps['padding']>({ initial: 'sp4', bp768: 'sp16' });
	assertType<UtilityProps['display']>({ initial: 'block', bp1536: 'flex' });

	// @ts-expect-error — not a breakpoint
	assertType<UtilityProps['padding']>({ initial: 'sp4', tablet: 'sp16' });
	// @ts-expect-error — the value must still be a space step at every breakpoint
	assertType<UtilityProps['padding']>({ initial: '16px' });
});

test('unconstrained properties keep property-specific CSS value typing', () => {
	// `inlineSize` and `order` are `true` scales: they accept the csstype value for that property,
	// not a widened `string | number`.
	assertType<UtilityProps['inlineSize']>('400px');
	assertType<UtilityProps['inlineSize']>('100%');
	assertType<UtilityProps['inlineSize']>('min-content');
	assertType<UtilityProps['order']>(1);
	assertType<UtilityProps['order']>('inherit');
	assertType<UtilityProps['flex']>('1 1 auto');
	assertType<UtilityProps['flex']>('none');

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
	expectTypeOf<CreateSprinkles['properties']>().toEqualTypeOf<ReadonlySet<keyof SprinklesProps>>();
	// @ts-expect-error — the public type is read-only; mutation APIs are not part of the contract
	createSprinkles.properties.add('display');
});

test('createSprinkles keeps non-utility props on the result type', () => {
	const result = createSprinkles({ display: 'flex', id: 'root', 'data-testid': 'box' });
	expectTypeOf(result.id).toEqualTypeOf<string>();
	expectTypeOf(result['data-testid']).toEqualTypeOf<string>();
	expectTypeOf(result.className).toEqualTypeOf<string>();
	expectTypeOf(result.style).toEqualTypeOf<Record<string, string>>();
	expectTypeOf(result).not.toHaveProperty('display');
});
