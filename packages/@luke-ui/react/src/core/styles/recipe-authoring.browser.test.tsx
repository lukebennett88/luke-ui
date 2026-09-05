import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { recipe } from './recipe-authoring.js';

/** Read computed styles from the complete `stylex.props(...)` result. */
function computedForProps(props: { className?: string; style?: CSSProperties }) {
	const { container } = render(<div {...props} />);
	return getComputedStyle(container.firstElementChild as HTMLElement);
}

// These cases cover application-order precedence for physical and logical properties.
const overlapStyles = stylex.create({
	paddingInlineStartFirst: { paddingInlineStart: '4px' },
	paddingLeftFirst: { paddingLeft: '4px' },
	paddingShorthandFirst: { padding: '4px' },
	paddingShorthandSecond: { padding: '20px' },
});

test('a later shorthand wins over an earlier overlapping physical longhand', () => {
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingLeftFirst, overlapStyles.paddingShorthandSecond),
	);
	expect(computed.paddingLeft).toBe('20px');
});

test('a later physical longhand wins over an earlier overlapping shorthand', () => {
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingShorthandFirst, overlapStyles.paddingLeftFirst),
	);
	expect(computed.paddingLeft).toBe('4px');
	expect(computed.paddingRight).toBe('4px');
});

// StyleX 0.19.0 currently leaves the logical longhand in place. Update or remove this assertion
// when StyleX fixes shorthand tombstones.
test('a later shorthand currently leaves an earlier logical longhand in place', () => {
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingInlineStartFirst, overlapStyles.paddingShorthandSecond),
	);
	expect(computed.paddingLeft).toBe('4px');
});

test('a later physical property wins over an earlier overlapping logical property', () => {
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingInlineStartFirst, overlapStyles.paddingLeftFirst),
	);
	expect(computed.paddingLeft).toBe('4px');
});

test('a later logical property wins over an earlier overlapping physical property', () => {
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingLeftFirst, overlapStyles.paddingInlineStartFirst),
	);
	expect(computed.paddingLeft).toBe('4px');
});

test('a later dynamic (function) longhand wins over an earlier overlapping static shorthand', () => {
	const dynamicPadding = stylex.create({
		dynamic: (value: string) => ({ paddingInlineStart: value }),
	});
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingShorthandFirst, dynamicPadding.dynamic('20px')),
	);
	expect(computed.paddingLeft).toBe('20px');
});

// StyleX 0.19.0 currently leaves the logical longhand in place. Update or remove this assertion
// when StyleX fixes shorthand tombstones.
test('a later dynamic shorthand currently leaves an earlier logical longhand in place', () => {
	const dynamicPadding = stylex.create({
		dynamic: (value: string) => ({ padding: value }),
	});
	const computed = computedForProps(
		stylex.props(overlapStyles.paddingInlineStartFirst, dynamicPadding.dynamic('20px')),
	);
	expect(computed.paddingLeft).toBe('4px');
});

const authoredRecipe = recipe({
	base: { display: 'flex' },
	compoundVariants: [{ size: 'large', tone: 'accent', style: { color: 'rgb(7, 8, 9)' } }],
	defaultVariants: { size: 'small', tone: 'neutral' },
	variants: {
		size: { large: { color: 'rgb(10, 20, 30)' }, small: { color: 'rgb(1, 2, 3)' } },
		tone: { accent: { color: 'rgb(4, 5, 6)' }, neutral: { color: 'rgb(40, 50, 60)' } },
	},
});

const authoredSlots = recipe({
	compoundVariants: [{ size: 'large', style: { track: { color: 'rgb(70, 80, 90)' } } }],
	defaultVariants: { size: 'small' },
	slots: {
		root: { display: 'grid', color: 'rgb(11, 12, 13)' },
		track: { color: 'rgb(21, 22, 23)' },
	},
	variants: {
		size: { large: { track: { color: 'rgb(31, 32, 33)' } }, small: null },
	},
});

test('an authored recipe resolves its base and defaults into real declarations', () => {
	const computed = computedForProps(authoredRecipe());
	expect(computed.display).toBe('flex');
	expect(computed.color).toBe('rgb(40, 50, 60)');
});

test('a later variant group wins over an earlier one for the same authored property', () => {
	const computed = computedForProps(authoredRecipe({ size: 'large', tone: 'neutral' }));
	expect(computed.color).toBe('rgb(40, 50, 60)');
});

test('an authored compound variant wins over the simple variants it overlaps', () => {
	const computed = computedForProps(authoredRecipe({ size: 'large', tone: 'accent' }));
	expect(computed.color).toBe('rgb(7, 8, 9)');
});

test('a consumer xstyle wins over every style the recipe itself applies', () => {
	const override = stylex.create({ override: { color: 'rgb(99, 98, 97)' } });
	const computed = computedForProps(
		authoredRecipe({ size: 'large', tone: 'accent', xstyle: override.override }),
	);
	expect(computed.color).toBe('rgb(99, 98, 97)');
});

test('an authored slotted recipe styles each slot independently', () => {
	const parts = authoredSlots({ size: 'large' });

	expect(computedForProps(parts.root).color).toBe('rgb(11, 12, 13)');
	expect(computedForProps(parts.root).display).toBe('grid');
	expect(computedForProps(parts.track).color).toBe('rgb(70, 80, 90)');
});

test('a slotted xstyle applies only to the slot it names', () => {
	const override = stylex.create({ override: { color: 'rgb(96, 95, 94)' } });
	const parts = authoredSlots({ xstyle: { track: override.override } });

	expect(computedForProps(parts.root).color).toBe('rgb(11, 12, 13)');
	expect(computedForProps(parts.track).color).toBe('rgb(96, 95, 94)');
});

test('a dynamic (function) style passed as xstyle reaches the element as spreadable props', () => {
	const dynamic = stylex.create({ width: (value: string) => ({ inlineSize: value }) });
	const props = authoredRecipe({ xstyle: dynamic.width('120px') });

	expect(typeof props.className).toBe('string');
	const computed = computedForProps(props);
	expect(computed.width).toBe('120px');
	expect(computed.display).toBe('flex');
});
