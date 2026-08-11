import { expect } from 'vite-plus/test';
import { testIntegration, testUniversalConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { componentTestRegistration } from './component-test-registration.js';
import { Link } from './index.js';

testUniversalConformance({
	getTarget: (result) => {
		const target = result.locator.getByRole('link', { name: 'Settings' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a link.');
		return target;
	},
	name: 'Link',
	registration: componentTestRegistration,
	render: (props = {}) => {
		return render(
			<Link {...props} href="/settings">
				Settings
			</Link>,
		);
	},
});

testIntegration(componentTestRegistration, 'Link', async () => {
	let pressed = false;
	const { locator, user } = render(<Link onPress={() => (pressed = true)}>Settings</Link>);

	await user.click(locator.getByRole('link', { name: 'Settings' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});
