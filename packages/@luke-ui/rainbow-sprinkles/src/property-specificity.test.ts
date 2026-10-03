import { expect, test } from 'vite-plus/test';
import { orderPropertiesBySpecificity } from './property-specificity.js';

test('emits a shorthand before narrower properties even when the config lists them first', () => {
	expect(orderPropertiesBySpecificity(['columnGap', 'rowGap', 'gap', 'display'])).toEqual([
		'gap',
		'display',
		'columnGap',
		'rowGap',
	]);
});

test('orders a broad shorthand before a narrower shorthand before a narrower property', () => {
	expect(orderPropertiesBySpecificity(['marginInlineStart', 'margin', 'marginInline'])).toEqual([
		'margin',
		'marginInline',
		'marginInlineStart',
	]);
});

test('orders a narrower property after its shorthand when the middle shorthand is absent', () => {
	expect(orderPropertiesBySpecificity(['marginInlineStart', 'padding', 'margin'])).toEqual([
		'padding',
		'margin',
		'marginInlineStart',
	]);
});

test('keeps sibling narrower properties after their shared shorthand', () => {
	expect(orderPropertiesBySpecificity(['overflowY', 'overflow', 'overflowX'])).toEqual([
		'overflow',
		'overflowY',
		'overflowX',
	]);
});

test('orders nested grid placement shorthands before start and end properties', () => {
	expect(
		orderPropertiesBySpecificity([
			'gridColumnStart',
			'gridRowEnd',
			'gridArea',
			'gridColumn',
			'gridRow',
		]),
	).toEqual(['gridArea', 'gridColumn', 'gridRow', 'gridColumnStart', 'gridRowEnd']);
});

test('orders flex narrower properties after the flex shorthand', () => {
	expect(orderPropertiesBySpecificity(['flexGrow', 'flex', 'flexBasis', 'flexShrink'])).toEqual([
		'flex',
		'flexGrow',
		'flexBasis',
		'flexShrink',
	]);
});

test('orders placeSelf before its alignment properties', () => {
	expect(orderPropertiesBySpecificity(['justifySelf', 'alignSelf', 'placeSelf'])).toEqual([
		'placeSelf',
		'justifySelf',
		'alignSelf',
	]);
});
