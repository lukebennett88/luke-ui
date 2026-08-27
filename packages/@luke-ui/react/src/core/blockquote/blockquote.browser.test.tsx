import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Blockquote } from './index.js';

testConformance({
	path: 'blockquote',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Blockquote element.');
		return target;
	},
	render: (props = {}) => render(<Blockquote {...props}>Quoted text</Blockquote>),
});
