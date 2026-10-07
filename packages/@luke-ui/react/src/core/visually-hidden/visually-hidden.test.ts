import type { VisuallyHiddenProps } from '@luke-ui/react/visually-hidden';
import { createElement } from 'react';
import type { ReactElement, RefCallback } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

type RenderRoot = NonNullable<VisuallyHiddenProps['renderRoot']>;

test('VisuallyHidden renderRoot receives resolved props and empty state', () => {
	expectTypeOf<Parameters<RenderRoot>['length']>().toEqualTypeOf<2>();
	expectTypeOf<keyof Parameters<RenderRoot>[0]>().toEqualTypeOf<
		'children' | 'className' | 'onBlur' | 'onFocus' | 'ref' | 'style'
	>();
	expectTypeOf<Extract<keyof Parameters<RenderRoot>[0], 'isFocusable'>>().toEqualTypeOf<never>();
	expectTypeOf<Parameters<RenderRoot>[1]>().toEqualTypeOf<Record<string, never>>();
	expectTypeOf<ReturnType<RenderRoot>>().toEqualTypeOf<ReactElement>();
	assertType<VisuallyHiddenProps>({
		renderRoot: (domProps, _state) => createElement('a', { ...domProps, href: '#main' }),
	});
	assertType<Parameters<RenderRoot>[1]>({});
	// @ts-expect-error — VisuallyHidden has no public focus state on renderRoot
	assertType<Parameters<RenderRoot>[1]>({ isFocused: true });
	// @ts-expect-error — renderRoot must return an element
	assertType<RenderRoot>(() => null);
	expectTypeOf<Parameters<RenderRoot>[0]['ref']>().toMatchTypeOf<RefCallback<HTMLElement>>();
});

test('VisuallyHidden renderRoot and elementType are mutually exclusive', () => {
	assertType<VisuallyHiddenProps>({ elementType: 'h2', ref: null });
	// @ts-expect-error — the caller-owned root chooses its own element
	assertType<VisuallyHiddenProps>({
		elementType: 'h2',
		renderRoot: () => createElement('a'),
	});
	// @ts-expect-error — DOM attributes belong on the caller-owned element
	assertType<VisuallyHiddenProps>({ id: 'root', renderRoot: () => createElement('a') });
});
