import type { BoxProps } from '@luke-ui/react/box';
import type { GridItemProps } from '@luke-ui/react/grid';
import { createElement } from 'react';
import type { ReactElement, RefCallback } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

type RenderRoot = NonNullable<GridItemProps['renderRoot']>;

test('GridItem accepts area, column, and row placement', () => {
	assertType<GridItemProps>({ area: 'sidebar' });
	assertType<GridItemProps>({ column: 'span 2', row: '1 / 3' });
	assertType<GridItemProps>({ column: '1 / -1' });
	assertType<GridItemProps>({ column: 'auto', row: 'auto' });
	assertType<GridItemProps>({ column: '2', row: '3' });
	assertType<GridItemProps>({ column: '2 / 4', row: '1 / span 2' });
	assertType<GridItemProps>({ column: 'span 3' });
});

test('GridItem accepts responsive placement', () => {
	assertType<GridItemProps>({ area: { initial: 'a', bp768: 'b' } });
	assertType<GridItemProps>({ column: { initial: 'span 1', bp768: 'span 3' } });
	assertType<GridItemProps>({ row: { initial: 'auto', bp1024: '1 / 3' } });
	assertType<GridItemProps>({ column: { bp768: 'span 2' } });
	// @ts-expect-error — responsive values use the same grammar
	assertType<GridItemProps>({ column: { initial: 'space.32' } });
	// @ts-expect-error — unknown conditions are not responsive keys
	assertType<GridItemProps>({ column: { bp100: 'span 2' } });
});

test('GridItem area is a plain string, so a token-shaped name compiles', () => {
	// An application-defined area name has no token interpretation. It may still not exist in `areas`.
	assertType<GridItemProps>({ area: 'space.32' });
	expectTypeOf<NonNullable<GridItemProps['area']>>().toExtend<
		string | { initial?: string | null }
	>();
});

test('GridItem column and row reject token values and non-grammar input', () => {
	// @ts-expect-error — column takes line placements, not tokens
	assertType<GridItemProps>({ column: 'space.32' });
	// @ts-expect-error — row takes line placements, not tokens
	assertType<GridItemProps>({ row: 'space.32' });
	// @ts-expect-error — a bare keyword is not a placement
	assertType<GridItemProps>({ column: 'span' });
	// @ts-expect-error — a span needs a count
	assertType<GridItemProps>({ column: 'span two' });
	// @ts-expect-error — named lines use className
	assertType<GridItemProps>({ column: 'content-start / content-end' });
	// @ts-expect-error — three-part placements are not supported
	assertType<GridItemProps>({ row: '1 / 2 / 3' });
	// @ts-expect-error — numbers are not accepted, use a string
	assertType<GridItemProps>({ column: 2 });
	// @ts-expect-error — the empty string is not a placement
	assertType<GridItemProps>({ row: '' });
});

test('GridItem rejects Box and layout styling props', () => {
	// @ts-expect-error — compose Box through renderRoot for styling
	assertType<GridItemProps>({ padding: 'space.16' });
	// @ts-expect-error — compose Box through renderRoot for styling
	assertType<GridItemProps>({ backgroundColor: 'surface.base' });
	// @ts-expect-error — compose Box through renderRoot for styling
	assertType<GridItemProps>({ display: 'flex' });
	// @ts-expect-error — compose Box through renderRoot for styling
	assertType<GridItemProps>({ alignSelf: 'center' });
	// @ts-expect-error — the removed Box placement props are not accepted either
	assertType<GridItemProps>({ gridColumn: 'span 2' });
	// @ts-expect-error — the removed Box placement props are not accepted either
	assertType<GridItemProps>({ gridArea: 'a' });
	// @ts-expect-error — GridItem does not define tracks
	assertType<GridItemProps>({ columns: 2 });
});

test('GridItem accepts the Box-family root props', () => {
	assertType<GridItemProps>({
		children: 'Content',
		className: 'consumer',
		elementType: 'li',
		id: 'item',
		style: { color: 'red' },
	});
	assertType<GridItemProps>({ ref: null });
	// @ts-expect-error — only supported structural elements are accepted
	assertType<GridItemProps>({ elementType: 'button' });
});

test('GridItem renderRoot and elementType are mutually exclusive', () => {
	assertType<GridItemProps>({
		column: 'span 2',
		renderRoot: (domProps) => createElement('section', domProps),
	});
	// @ts-expect-error — the caller-owned root chooses its own element
	assertType<GridItemProps>({ elementType: 'section', renderRoot: () => createElement('section') });
	// @ts-expect-error — DOM attributes belong on the caller-owned element
	assertType<GridItemProps>({ id: 'root', renderRoot: () => createElement('section') });
});

test('GridItem renderRoot shares the Box contract', () => {
	expectTypeOf<RenderRoot>().toEqualTypeOf<NonNullable<BoxProps['renderRoot']>>();
	expectTypeOf<keyof Parameters<RenderRoot>[0]>().toEqualTypeOf<
		'children' | 'className' | 'ref' | 'style'
	>();
	expectTypeOf<Parameters<RenderRoot>[0]['ref']>().toEqualTypeOf<RefCallback<HTMLElement>>();
	expectTypeOf<Parameters<RenderRoot>[1]>().toEqualTypeOf<Record<string, never>>();
	expectTypeOf<ReturnType<RenderRoot>>().toEqualTypeOf<ReactElement>();
});
