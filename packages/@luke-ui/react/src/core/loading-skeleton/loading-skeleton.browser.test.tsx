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
