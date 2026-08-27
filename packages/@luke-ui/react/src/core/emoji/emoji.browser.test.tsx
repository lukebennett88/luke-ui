import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Emoji } from './index.js';

testConformance({
	path: 'emoji',
	getTarget: (result) => {
		const target = result.locator.getByRole('img', { name: 'Celebration' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected an Emoji element.');
		return target;
	},
	render: (props = {}) => render(<Emoji {...props} emoji="🎉" label="Celebration" />),
});
