import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Quote } from './index.js';

testConformance({
	path: 'quote',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Quote element.');
		return target;
	},
	render: (props = {}) => render(<Quote {...props}>short quote</Quote>),
});
