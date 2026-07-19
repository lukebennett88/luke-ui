import { expect, expectTypeOf, test } from 'vite-plus/test';
import type { SprinklesProps } from './utilities.js';
import { boxProperties, createSprinkles } from './utilities.js';

const responsiveLayout = {
	alignItems: { medium: 'center', xsmall: 'stretch' },
	display: { medium: 'grid', xsmall: 'flex' },
	flex: '1 1 auto',
	gap: { medium: '600', xsmall: '200' },
	gridColumn: '1 / -1',
	inlineSize: '100%',
	marginInline: 'auto',
	padding: { small: '400', xsmall: '300' },
} as const satisfies SprinklesProps;

test('types the curated Box surface', () => {
	expectTypeOf(responsiveLayout).toExtend<SprinklesProps>();
	expect(boxProperties).toContain('display');
	expect(boxProperties).toContain('gridColumn');
	expect(boxProperties).not.toContain('color');
	expect(boxProperties).not.toContain('backgroundColor');
	expect(boxProperties).not.toContain('fontSize');
});

test('keeps arbitrary dynamic values non-responsive', () => {
	const styles = createSprinkles({ inlineSize: 'calc(100% - 2rem)', padding: '400' });
	expect(styles.className).not.toBe('');
	expect(styles.style['--box-inline-size']).toBe('calc(100% - 2rem)');
});

const removedColor = {
	// @ts-expect-error Direct colour is not part of Box.
	color: 'danger',
} satisfies SprinklesProps;

const responsiveDynamicValue = {
	// @ts-expect-error Arbitrary dynamic values are deliberately non-responsive.
	inlineSize: { small: '50%' },
} satisfies SprinklesProps;

void removedColor;
void responsiveDynamicValue;
