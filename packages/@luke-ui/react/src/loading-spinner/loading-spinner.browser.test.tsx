import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { LoadingSpinner } from './index.js';

testConformance({
	path: 'loading-spinner',
	getTarget: (result) => {
		const target = result.locator.getByRole('status').element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a LoadingSpinner element.');
		return target;
	},
	render: (props = {}) => render(<LoadingSpinner {...props} />),
});
