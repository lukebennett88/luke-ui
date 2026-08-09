import type { ComponentProps } from 'react';
import { expect } from 'vite-plus/test';
import { testIntegration, testUniversalConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { IconButton } from './index.js';

testUniversalConformance({
	getTarget: (result) => {
		const target = result.locator.getByRole('button', { name: 'Add' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected an icon button.');
		return target;
	},
	name: 'IconButton',
	render: (props = {}) =>
		render(
			<IconButton {...(props as ComponentProps<typeof IconButton>)} aria-label="Add" icon="add" />,
		),
});

testIntegration('IconButton', async () => {
	let pressed = false;
	const { locator, user } = render(
		<IconButton aria-label="Add" icon="add" onPress={() => (pressed = true)} />,
	);

	await user.click(locator.getByRole('button', { name: 'Add' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});
