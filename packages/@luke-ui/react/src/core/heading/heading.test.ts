import type { HeadingProps } from '@luke-ui/react/heading';
import { createElement } from 'react';
import { assertType, test } from 'vite-plus/test';

test('Heading inherits Text renderRoot exclusivity and colour tokens', () => {
	assertType<HeadingProps>({ color: 'secondary', level: 2 });
	assertType<HeadingProps>({ color: 'accent.rest', typography: 'display' });
	assertType<HeadingProps>({
		renderRoot: (domProps, _state) => createElement('h2', domProps),
	});
	// @ts-expect-error — elementType and renderRoot are mutually exclusive
	assertType<HeadingProps>({
		elementType: 'h2',
		renderRoot: () => createElement('h2'),
	});
	// @ts-expect-error — shorthand role names are not part of the colour API
	assertType<HeadingProps>({ color: 'accent' });
});
