import type { AspectRatioProps } from '@luke-ui/react/aspect-ratio';
import type { BleedProps } from '@luke-ui/react/bleed';
import type { BoxProps } from '@luke-ui/react/box';
import type { ClusterProps } from '@luke-ui/react/cluster';
import type { ContainerProps } from '@luke-ui/react/container';
import type { GridProps } from '@luke-ui/react/grid';
import type { StackProps } from '@luke-ui/react/stack';
import { createElement } from 'react';
import type { HTMLAttributes, ReactElement, RefCallback } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

type RenderRoot = NonNullable<BoxProps['renderRoot']>;

test('Box renderRoot receives resolved presentation props and empty state', () => {
	expectTypeOf<Parameters<RenderRoot>['length']>().toEqualTypeOf<2>();
	expectTypeOf<keyof Parameters<RenderRoot>[0]>().toEqualTypeOf<
		'children' | 'className' | 'ref' | 'style'
	>();
	expectTypeOf<Parameters<RenderRoot>[0]>().toMatchTypeOf<
		Pick<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'> & {
			ref: RefCallback<HTMLElement>;
		}
	>();
	expectTypeOf<Parameters<RenderRoot>[1]>().toEqualTypeOf<Record<string, never>>();
	expectTypeOf<ReturnType<RenderRoot>>().toEqualTypeOf<ReactElement>();
	assertType<BoxProps>({ renderRoot: (domProps, _state) => createElement('section', domProps) });
	assertType<Parameters<RenderRoot>[1]>({});
	// @ts-expect-error — Box has no public hover state
	assertType<Parameters<RenderRoot>[1]>({ isHovered: true });
	// @ts-expect-error — a renderRoot callback cannot require state Box does not expose
	assertType<RenderRoot>((domProps, _state: { isHovered: boolean }) =>
		createElement('section', domProps),
	);
	// @ts-expect-error — renderRoot must return an element
	assertType<RenderRoot>(() => null);
});

test('Box renderRoot and elementType are mutually exclusive', () => {
	assertType<BoxProps>({ elementType: 'section', ref: null });
	// @ts-expect-error — the caller-owned root chooses its own element
	assertType<BoxProps>({ elementType: 'section', renderRoot: () => createElement('section') });
	// @ts-expect-error — DOM attributes belong on the caller-owned element
	assertType<BoxProps>({ id: 'root', renderRoot: () => createElement('section') });
});

test('Box-like layout components share the two-argument renderRoot contract', () => {
	expectTypeOf<NonNullable<AspectRatioProps['renderRoot']>>().toEqualTypeOf<RenderRoot>();
	expectTypeOf<NonNullable<BleedProps['renderRoot']>>().toEqualTypeOf<RenderRoot>();
	expectTypeOf<NonNullable<ClusterProps['renderRoot']>>().toEqualTypeOf<RenderRoot>();
	expectTypeOf<NonNullable<ContainerProps['renderRoot']>>().toEqualTypeOf<RenderRoot>();
	expectTypeOf<NonNullable<GridProps['renderRoot']>>().toEqualTypeOf<RenderRoot>();
	expectTypeOf<NonNullable<StackProps['renderRoot']>>().toEqualTypeOf<RenderRoot>();
});
