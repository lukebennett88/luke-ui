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
		<Link appearance="button" href="#" onPress={() => (pressed = true)} prominence="high">
			Settings
		</Link>,
	);
	const link = locator.getByRole('link', { name: 'Settings' }).element();

	expect(link.tagName).toBe('A');
	expect(link).toHaveAttribute('href', '#');

	await user.click(locator.getByRole('link', { name: 'Settings' }));
	expect(pressed).toBe(true);
});

test('hover inverts the text Link underline, and low prominence reverses the rest state', () => {
	const { locator } = render(
		<div>
			<Link href="#" prominence="low">
				Low
			</Link>
			<Link href="#" prominence="standard">
				Standard
			</Link>
			<Link href="#" prominence="high">
				High
			</Link>
		</div>,
	);
	const low = locator.getByRole('link', { name: 'Low' }).element();
	const standard = locator.getByRole('link', { name: 'Standard' }).element();
	const high = locator.getByRole('link', { name: 'High' }).element();

	for (const link of [low, standard, high]) {
		link.style.transition = 'none';
	}

	expect(getComputedStyle(low).textDecorationLine).toBe('none');
	expect(getComputedStyle(standard).textDecorationLine).toBe('underline');
	expect(getComputedStyle(high).textDecorationLine).toBe('underline');

	low.setAttribute('data-hovered', 'true');
	standard.setAttribute('data-hovered', 'true');
	high.setAttribute('data-hovered', 'true');

	expect(getComputedStyle(low).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standard).textDecorationLine).toBe('none');
	expect(getComputedStyle(high).textDecorationLine).toBe('none');
});

test('focus-visible keeps the underline over hover and pressed', () => {
	const { locator } = render(
		<div>
			<Link href="#" prominence="low">
				Low
			</Link>
			<Link href="#" prominence="standard">
				Standard
			</Link>
		</div>,
	);
	const low = locator.getByRole('link', { name: 'Low' }).element();
	const standard = locator.getByRole('link', { name: 'Standard' }).element();

	for (const link of [low, standard]) {
		link.style.transition = 'none';
	}

	low.setAttribute('data-focus-visible', 'true');
	low.setAttribute('data-hovered', 'true');
	standard.setAttribute('data-focus-visible', 'true');
	standard.setAttribute('data-hovered', 'true');

	expect(getComputedStyle(low).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standard).textDecorationLine).toBe('underline');

	low.removeAttribute('data-hovered');
	standard.removeAttribute('data-hovered');
	low.setAttribute('data-pressed', 'true');
	standard.setAttribute('data-pressed', 'true');

	expect(getComputedStyle(low).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standard).textDecorationLine).toBe('underline');
});

test('a disabled Link exposes disabled state in either appearance', () => {
	const { locator } = render(
		<div>
			<Link href="#" isDisabled>
				Text link
			</Link>
			<Link appearance="button" href="#" isDisabled prominence="high">
				Button link
			</Link>
		</div>,
	);

	const textLink = locator.getByRole('link', { name: 'Text link' }).element();
	const buttonLink = locator.getByRole('link', { name: 'Button link' }).element();
	expect(textLink).toHaveAttribute('data-disabled', 'true');
	expect(buttonLink).toHaveAttribute('data-disabled', 'true');
});
