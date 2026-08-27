import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Text } from './text.js';

testConformance({
	path: 'text',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Text element.');
		return target;
	},
	render: (props = {}) => render(<Text {...props}>Body copy</Text>),
});
