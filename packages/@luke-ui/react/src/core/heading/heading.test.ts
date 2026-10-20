import type { HeadingProps } from '@luke-ui/react/heading';
import { createElement } from 'react';
import { assertType, test } from 'vite-plus/test';

test('Heading inherits Text renderRoot exclusivity', () => {
	assertType<HeadingProps>({ color: 'secondary', level: 2 });
	assertType<HeadingProps>({ color: 'accent', typography: 'display' });
	assertType<HeadingProps>({
		renderRoot: (domProps, _state) => createElement('h2', domProps),
	});
	// @ts-expect-error — elementType and renderRoot are mutually exclusive
	assertType<HeadingProps>({
		elementType: 'h2',
		renderRoot: () => createElement('h2'),
	});
});
