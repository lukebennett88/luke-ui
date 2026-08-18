import { testConformance } from '../../conformance/helpers.js';
import { render } from '../../test-utils/render.js';
import { Button } from './index.js';

testConformance({
	path: 'primitives/button',
	getTarget: (result) => {
		const target = result.locator.getByRole('button').element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a button primitive.');
		return target;
	},
	render: (props = {}) => render(<Button {...props}>Action</Button>),
});
