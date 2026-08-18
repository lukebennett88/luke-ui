import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Numeral } from './index.js';

testConformance({
	path: 'numeral',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Numeral element.');
		return target;
	},
	render: (props = {}) => render(<Numeral {...props} value={12} />),
});
