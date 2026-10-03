import { expect, test } from 'vite-plus/test';
import { orderPropertiesBySpecificity } from './property-specificity.js';

test('emits a shorthand before longhands even when the config lists longhands first', () => {
	expect(orderPropertiesBySpecificity(['columnGap', 'rowGap', 'gap', 'display'])).toEqual([
		'gap',
		'display',
		'columnGap',
		'rowGap',
	]);
});

test('orders a broad shorthand before a narrower shorthand before a longhand', () => {
	expect(orderPropertiesBySpecificity(['marginInlineStart', 'margin', 'marginInline'])).toEqual([
		'margin',
		'marginInline',
		'marginInlineStart',
	]);
});

test('orders a longhand after its shorthand when the middle shorthand is absent', () => {
	expect(orderPropertiesBySpecificity(['marginInlineStart', 'padding', 'margin'])).toEqual([
		'padding',
		'margin',
		'marginInlineStart',
	]);
});

test('keeps sibling longhands after their shared shorthand', () => {
	expect(orderPropertiesBySpecificity(['overflowY', 'overflow', 'overflowX'])).toEqual([
		'overflow',
		'overflowY',
		'overflowX',
	]);
});

test('orders nested grid placement shorthands before start and end longhands', () => {
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

test('orders flex longhands after the flex shorthand', () => {
	expect(orderPropertiesBySpecificity(['flexGrow', 'flex', 'flexBasis', 'flexShrink'])).toEqual([
		'flex',
		'flexGrow',
		'flexBasis',
		'flexShrink',
	]);
});

test('orders placeSelf before its alignment longhands', () => {
	expect(orderPropertiesBySpecificity(['justifySelf', 'alignSelf', 'placeSelf'])).toEqual([
		'placeSelf',
		'justifySelf',
		'alignSelf',
	]);
});
