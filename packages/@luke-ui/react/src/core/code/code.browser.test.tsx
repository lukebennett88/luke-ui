import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Code } from './index.js';

testConformance({
	path: 'code',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Code element.');
		return target;
	},
	render: (props = {}) => render(<Code {...props}>npm install</Code>),
});
