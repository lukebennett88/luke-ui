import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { VisuallyHidden } from './index.js';

testConformance({
	path: 'visually-hidden',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a VisuallyHidden element.');
		return target;
	},
	render: (props = {}) => render(<VisuallyHidden {...props}>Hidden label</VisuallyHidden>),
});
