import { Em } from '@luke-ui/react/em';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

test('Em forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Em className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			stressed
		</Em>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected an Em element.');

	expectForwardsDomProps(target, ref);
});
