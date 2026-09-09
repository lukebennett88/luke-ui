import { expect, test } from 'vite-plus/test';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Link } from './link.js';

testConformance({
	path: 'link',
	getTarget: (result) => {
		const target = result.locator.getByRole('link', { name: 'Settings' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a link.');
		return target;
	},
	render: (props = {}) => {
		return render(
			<Link {...props} href="#">
				Settings
			</Link>,
		);
	},
});

testIntegration('link', async () => {
	let pressed = false;
	const { locator, user } = render(
		<Link href="#" onPress={() => (pressed = true)}>
			Settings
		</Link>,
	);

	await user.click(locator.getByRole('link', { name: 'Settings' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});

test('a default text Link keeps inline text geometry', () => {
	const { locator } = render(
		<p>
			Before <Link href="#">destination</Link> after
		</p>,
	);
	const styles = getComputedStyle(locator.getByRole('link', { name: 'destination' }).element());

	expect(styles.display).toBe('inline');
	expect(styles.paddingInline).toBe('0px');
	expect(styles.whiteSpace).toBe('normal');
});

test('a button-shaped Link keeps link semantics', async () => {
	let pressed = false;
	const { locator, user } = render(
		<Link appearance="button" href="#" onPress={() => (pressed = true)} tone="accent">
			Settings
		</Link>,
	);
	const link = locator.getByRole('link', { name: 'Settings' }).element();

	expect(link.tagName).toBe('A');
	expect(link).toHaveAttribute('href', '#');

	await user.click(locator.getByRole('link', { name: 'Settings' }));
	expect(pressed).toBe(true);
});

test('a disabled Link exposes disabled state in either appearance', () => {
	const { locator } = render(
		<div>
			<Link href="#" isDisabled>
				Text link
			</Link>
			<Link appearance="button" href="#" isDisabled tone="accent">
				Button link
			</Link>
		</div>,
	);

	const textLink = locator.getByRole('link', { name: 'Text link' }).element();
	const buttonLink = locator.getByRole('link', { name: 'Button link' }).element();
	expect(textLink).toHaveAttribute('data-disabled', 'true');
	expect(buttonLink).toHaveAttribute('data-disabled', 'true');
});
