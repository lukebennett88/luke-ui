import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Box } from './box.js';

testConformance({
	path: 'box',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Box element.');
		return target;
	},
	render: (props = {}) => render(<Box {...props}>Content</Box>),
});

test('renders semantic elements and a consumer-owned render prop', () => {
	const semanticResult = render(
		<Box aria-label="Account summary" elementType="section">
			Account summary content
		</Box>,
	);
	const section = semanticResult.locator.getByRole('region', { name: 'Account summary' });
	expect(section.element().tagName).toBe('SECTION');

	let receivedAriaLabel = false;
	const customResult = render(
		<Box
			aria-label="Ignored Box label"
			render={(resolvedProps) => {
				receivedAriaLabel = Object.hasOwn(resolvedProps, 'aria-label');
				return <div {...resolvedProps} />;
			}}
			style={{ display: 'grid' }}
		>
			Custom div
		</Box>,
	);
	const div = customResult.locator.getByText('Custom div').element();
	if (!(div instanceof HTMLDivElement)) throw new Error('Expected custom rendered div.');

	expect(receivedAriaLabel).toBe(false);
	expect(div.style.display).toBe('grid');
});
