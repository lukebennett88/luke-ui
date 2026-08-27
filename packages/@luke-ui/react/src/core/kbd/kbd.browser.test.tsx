import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Kbd } from './index.js';

testConformance({
	path: 'kbd',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Kbd element.');
		return target;
	},
	render: (props = {}) => render(<Kbd {...props}>⌘</Kbd>),
});
