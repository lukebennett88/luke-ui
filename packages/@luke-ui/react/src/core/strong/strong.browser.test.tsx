import { Strong } from '@luke-ui/react/strong';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

test('Strong forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Strong {...forwardedDomProps} ref={ref}>
			important
		</Strong>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected a Strong element.');

	expectForwardsDomProps(target, ref);
});
