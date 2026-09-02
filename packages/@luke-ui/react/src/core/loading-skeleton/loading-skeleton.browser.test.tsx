import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { LoadingSkeleton } from './loading-skeleton.js';

testConformance({
	path: 'loading-skeleton',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a LoadingSkeleton element.');
		return target;
	},
	render: (props = {}) => render(<LoadingSkeleton {...props}>Loading copy</LoadingSkeleton>),
});

test('resets a consumer-supplied border on the inline skeleton surface', () => {
	const { locator } = render(
		<LoadingSkeleton style={{ border: '4px solid red' }}>Loading copy</LoadingSkeleton>,
	);
	const skeleton = locator.getByText('Loading copy').element();
	if (!(skeleton instanceof HTMLElement)) throw new Error('Expected a LoadingSkeleton element.');

	const style = getComputedStyle(skeleton);
	expect(style.borderTopStyle).toBe('none');
	expect(style.borderTopWidth).toBe('0px');
	expect(style.borderTopColor).toBe('rgba(0, 0, 0, 0)');
});
