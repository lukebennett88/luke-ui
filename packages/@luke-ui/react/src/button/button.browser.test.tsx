import { expect } from 'vite-plus/test';
import { testIntegration, testUniversalConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { componentTestRegistration } from './component-test-registration.js';
import { Button } from './index.js';

testUniversalConformance({
	getTarget: (result) => {
		const target = result.locator.getByRole('button').element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a button.');
		return target;
	},
	name: 'Button',
	registration: componentTestRegistration,
	render: (props = {}) => {
		return render(<Button {...props}>Action</Button>);
	},
});

testIntegration(componentTestRegistration, 'Button', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Action</Button>);

	await user.click(locator.getByRole('button', { name: 'Action' }));
	// The assertion belongs to the journey registered by testIntegration.
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});
