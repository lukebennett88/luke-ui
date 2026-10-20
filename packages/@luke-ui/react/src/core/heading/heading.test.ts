import type { HeadingProps, HeadingRenderRootState } from '@luke-ui/react/heading';
import { createElement } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('Heading inherits Text renderRoot exclusivity', () => {
	assertType<HeadingProps>({ color: 'secondary', level: 2 });
	assertType<HeadingProps>({ color: 'accent', typography: 'display' });
	assertType<HeadingProps>({
		renderRoot: (domProps, { element }) => createElement(element, domProps),
	});
	expectTypeOf<HeadingRenderRootState>().toEqualTypeOf<{
		element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
		level: 1 | 2 | 3 | 4 | 5 | 6;
	}>();
	// @ts-expect-error — elementType and renderRoot are mutually exclusive
	assertType<HeadingProps>({
		elementType: 'h2',
		renderRoot: () => createElement('h2'),
	});
});
