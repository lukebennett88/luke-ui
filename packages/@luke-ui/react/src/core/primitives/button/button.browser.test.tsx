import { Button } from '@luke-ui/react/primitives/button';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps } from '../../test-utils/forwarding.js';
import { render } from '../../test-utils/render.js';

/**
 * React 19 passes `ref` as an ordinary prop and these components spread it
 * through to the React Aria element, so ref forwarding works at runtime. React
 * Aria's own prop types never declare `ref`, so the public props type cannot
 * express it; this alias adds it back for the DOM-contract test below.
 */
const ButtonWithRef = Button as (
	props: ComponentProps<typeof Button> & { ref?: Ref<HTMLButtonElement> },
) => ReactNode;

test('the Button primitive forwards className, data attributes, id, and ref to the button', () => {
	const ref = createRef<HTMLButtonElement>();
	const { locator } = render(
		<ButtonWithRef className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Action
		</ButtonWithRef>,
	);
	const target = locator.getByRole('button').element();

	expectForwardsDomProps(target, ref);
});
