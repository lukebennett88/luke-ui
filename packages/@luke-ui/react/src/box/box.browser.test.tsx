import { createRef } from 'react';
import type { ComponentProps } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { testUniversalConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { componentTestRegistration } from './component-test-registration.js';
import { Box } from './index.js';

testUniversalConformance({
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Box element.');
		return target;
	},
	name: 'Box',
	registration: componentTestRegistration,
	render: (props = {}) => render(<Box {...(props as ComponentProps<typeof Box>)}>Content</Box>),
});

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('renders a responsive layout at the retained breakpoints', async () => {
	const { locator } = render(
		<Box
			display="flex"
			flexDirection={{ initial: 'column', medium: 'row' }}
			gap={{ initial: '200', medium: '600' }}
		>
			<span>First item</span>
			<span>Second item</span>
		</Box>,
	);

	const box = locator.element().firstElementChild;
	if (!(box instanceof HTMLElement)) throw new Error('Expected Box element.');

	await page.viewport(640, 800);
	expect(getComputedStyle(box).flexDirection).toBe('column');
	expect(getComputedStyle(box).gap).toBe('8px');

	await page.viewport(768, 800);
	expect(getComputedStyle(box).flexDirection).toBe('row');
	expect(getComputedStyle(box).gap).toBe('24px');
});

test('forwards the ref through a custom rendered div', () => {
	const ref = createRef<HTMLDivElement>();
	const { locator } = render(
		<Box
			id="custom-div"
			ref={ref}
			render={(domProps) => <div data-motion="enabled" {...domProps} />}
		>
			Custom div
		</Box>,
	);

	const div = locator.element().firstElementChild;
	if (!(div instanceof HTMLDivElement)) throw new Error('Expected custom rendered div.');

	expect(ref.current).toBe(div);
	expect(div).toHaveAttribute('data-motion', 'enabled');
	expect(div).toHaveAttribute('id', 'custom-div');
	expect(div).toHaveTextContent('Custom div');
});
