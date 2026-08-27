import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Strong } from './index.js';

testConformance({
	path: 'strong',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Strong element.');
		return target;
	},
	render: (props = {}) => render(<Strong {...props}>important</Strong>),
});
