import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

test('VisuallyHidden forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<VisuallyHidden className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Hidden label
		</VisuallyHidden>,
	);
	const target = expectHtmlElement(
		container.firstElementChild,
		'Expected a VisuallyHidden element.',
	);

	expectForwardsDomProps(target, ref);
});
