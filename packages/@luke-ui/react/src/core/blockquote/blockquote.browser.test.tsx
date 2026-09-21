import { Blockquote } from '@luke-ui/react/blockquote';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

test('Blockquote forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Blockquote className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Quoted text
		</Blockquote>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected a Blockquote element.');

	expectForwardsDomProps(target, ref);
});
