import { expect, test } from 'vite-plus/test';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { IconButton } from './icon-button.js';

/** Intended Action spinner delay (~300ms). Kept in the test so production timing drifts fail. */
const ACTION_SPINNER_DELAY_MS = 300;

testConformance({
	path: 'icon-button',
	getTarget: (result) => {
		const target = result.locator.getByRole('button', { name: 'Add' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected an icon button.');
		return target;
	},
	render: (props = {}) => {
		return render(<IconButton {...props} aria-label="Add" icon="add" />);
	},
});

testIntegration('icon-button', async () => {
	let pressed = false;
	const { locator, user } = render(
		<IconButton aria-label="Add" icon="add" onPress={() => (pressed = true)} />,
	);

	await user.click(locator.getByRole('button', { name: 'Add' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});

test('shares Action pending timing with Button', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});

	const { locator, user } = render(
		<IconButton
			aria-label="Save"
			icon="check"
			pressAction={async () => {
				await gate;
			}}
		/>,
	);
	const button = locator.getByRole('button', { name: 'Save' });

	await user.click(button);
	expect(button.element().getAttribute('data-pending')).toBe('true');
	expect(button.element().querySelector('[role="status"]')).toBeNull();

	await delay(ACTION_SPINNER_DELAY_MS - 50);
	expect(button.element().querySelector('[role="status"]')).toBeNull();

	await delay(150);
	expect(button.element().querySelector('[role="status"]')).not.toBeNull();

	release();
	await expect.poll(() => button.element().getAttribute('data-pending')).toBeNull();
});

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}
