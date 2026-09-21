import { Quote } from '@luke-ui/react/quote';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

test('Quote forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLQuoteElement>();
	const { container } = render(
		<Quote {...forwardedDomProps} ref={ref}>
			short quote
		</Quote>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected a Quote element.');

	expectForwardsDomProps(target, ref);
});
