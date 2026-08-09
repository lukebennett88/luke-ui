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

test('renders semantic and consumer-owned elements with resolved props', () => {
	const semanticResult = render(
		<Box aria-label="Account summary" display="flex" elementType="section" padding="400">
			Account summary content
		</Box>,
	);
	const section = semanticResult.locator.getByRole('region', { name: 'Account summary' });

	expect(section.element().tagName).toBe('SECTION');
	expect(getComputedStyle(section.element()).display).toBe('flex');
	expect(getComputedStyle(section.element()).padding).toBe('16px');

	let refElement: HTMLElement | null = null;
	let receivedAriaLabel = false;
	const customResult = render(
		<Box
			aria-label="Ignored Box label"
			className="consumer-class"
			ref={(element) => {
				refElement = element;
			}}
			render={(resolvedProps) => {
				receivedAriaLabel = Object.hasOwn(resolvedProps, 'aria-label');
				return (
					<div
						{...resolvedProps}
						aria-label="Custom layout"
						data-motion="enabled"
						id="custom-div"
					/>
				);
			}}
			style={{ display: 'grid' }}
		>
			Custom div
		</Box>,
	);
	const div = customResult.locator.getByText('Custom div').element();
	if (!(div instanceof HTMLDivElement)) throw new Error('Expected custom rendered div.');

	expect(refElement).toBe(div);
	expect(div).toHaveAttribute('data-motion', 'enabled');
	expect(div).toHaveAttribute('id', 'custom-div');
	expect(div).toHaveAttribute('aria-label', 'Custom layout');
	expect(receivedAriaLabel).toBe(false);
	expect(div).toHaveClass('consumer-class');
	expect(div.style.display).toBe('grid');
	expect(div).toHaveTextContent('Custom div');
});
