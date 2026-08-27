import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Em } from './index.js';

testConformance({
	path: 'em',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected an Em element.');
		return target;
	},
	render: (props = {}) => render(<Em {...props}>stressed</Em>),
});
