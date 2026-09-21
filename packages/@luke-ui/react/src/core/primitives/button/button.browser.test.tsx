import { Button } from '@luke-ui/react/primitives/button';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps, forwardedDomProps } from '../../test-utils/forwarding.js';
import { render } from '../../test-utils/render.js';

test('the Button primitive forwards className, data attributes, id, and ref to the button', () => {
	const ref = createRef<HTMLButtonElement>();
	const { locator } = render(
		<Button {...forwardedDomProps} ref={ref}>
			Action
		</Button>,
	);
	const target = locator.getByRole('button').element();

	expectForwardsDomProps(target, ref);
});
