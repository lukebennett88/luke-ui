import { expect } from 'vite-plus/test';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Button } from './index.js';

testConformance({
	path: 'button',
	getTarget: (result) => {
		const target = result.locator.getByRole('button').element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a button.');
		return target;
	},
	render: (props = {}) => {
		return render(<Button {...props}>Action</Button>);
	},
});

testIntegration('button', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Action</Button>);

	await user.click(locator.getByRole('button', { name: 'Action' }));
	// The assertion belongs to the journey registered by testIntegration.
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});
