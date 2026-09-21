import { Button } from '@luke-ui/react/primitives/button';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { createRef } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps } from '../../test-utils/forwarding.js';
import { render } from '../../test-utils/render.js';

// React Aria omits React 19's `ref` prop.
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
