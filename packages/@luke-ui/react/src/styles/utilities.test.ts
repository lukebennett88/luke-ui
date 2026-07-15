import { expect, expectTypeOf, test } from 'vite-plus/test';
import type { SprinklesProps } from './utilities.css.js';
import { createSprinkles } from './utilities.css.js';

const responsiveLayout = {
	alignItems: { medium: 'center', xsmall: 'stretch' },
	blockSize: { large: '50vh', xsmall: 'auto' },
	display: { medium: 'grid', xsmall: 'flex' },
	flex: '1 1 auto',
	flexBasis: '12rem',
	flexDirection: 'column',
	flexGrow: '1',
	flexShrink: '0',
	flexWrap: 'wrap',
	gap: { medium: '600', xsmall: '200' },
	gridColumn: '1 / -1',
	gridColumnEnd: 'span 2',
	gridColumnStart: '2',
	gridRow: 'auto / span 2',
	inlineSize: { medium: '50%', xsmall: '100%' },
	insetBlockStart: '0',
	insetInline: 'var(--luke-space-400)',
	justifyContent: 'space-between',
	marginBlock: '0',
	marginInline: 'auto',
	maxInlineSize: '64rem',
	minBlockSize: '10rem',
	overflow: 'auto',
	padding: { small: '400', xsmall: '300' },
	placeSelf: 'stretch',
	position: 'sticky',
	rowGap: '1000',
} as const satisfies SprinklesProps;

test('types the responsive layout-only surface', () => {
	expectTypeOf(responsiveLayout).toExtend<SprinklesProps>();
	expect(createSprinkles.properties).toContain('display');
	expect(createSprinkles.properties).toContain('gridColumn');
	expect(createSprinkles.properties).not.toContain('color');
	expect(createSprinkles.properties).not.toContain('backgroundColor');
	expect(createSprinkles.properties).not.toContain('fontSize');
});

const removedColor = {
	// @ts-expect-error Direct colour is not part of Sprinkles.
	color: 'danger',
} satisfies SprinklesProps;

const removedBackgroundColor = {
	// @ts-expect-error Direct background colour is not part of Sprinkles.
	backgroundColor: 'neutral',
} satisfies SprinklesProps;

const removedTypography = {
	// @ts-expect-error Typography is not part of Sprinkles.
	fontSize: '300',
} satisfies SprinklesProps;

const removedPseudoState = {
	// @ts-expect-error Pseudo-state colour props are not part of Sprinkles.
	color: { hover: 'danger' },
} satisfies SprinklesProps;

const invalidSpaceValue = {
	// @ts-expect-error Spacing accepts only semantic space steps.
	padding: '1rem',
} satisfies SprinklesProps;

const invalidResponsiveSpaceValue = {
	padding: {
		// @ts-expect-error Responsive spacing accepts only semantic space steps.
		small: '1rem',
	},
} satisfies SprinklesProps;

void removedColor;
void removedBackgroundColor;
void removedTypography;
void removedPseudoState;
void invalidSpaceValue;
void invalidResponsiveSpaceValue;
