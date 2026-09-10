import type { JSX } from 'react';
import { expect, test } from 'vite-plus/test';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { IconLink } from './icon-link.js';

/** A custom SVG that deliberately omits its own `aria-hidden` and any `<title>`. */
function UnlabelledCustomIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="8" fill="currentColor" />
		</svg>
	);
}

testConformance({
	path: 'icon-link',
	getTarget: (result) => {
		const target = result.locator.getByRole('link', { name: 'Search' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected an icon link.');
		return target;
	},
	render: (props = {}) => {
		return render(<IconLink {...props} aria-label="Search" href="#" icon="search" />);
	},
});

testIntegration('icon-link', async () => {
	let pressed = false;
	const { locator, user } = render(
		<IconLink aria-label="Search" href="#" icon="search" onPress={() => (pressed = true)} />,
	);

	await user.click(locator.getByRole('link', { name: 'Search' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});

test('renders a native anchor with the supplied href', () => {
	const { locator } = render(<IconLink aria-label="Search" href="/search" icon="search" />);
	const link = locator.getByRole('link', { name: 'Search' }).element();

	expect(link.tagName).toBe('A');
	expect(link).toHaveAttribute('href', '/search');
});

test('a built-in icon contributes no accessible name', () => {
	const { locator } = render(<IconLink aria-label="Repository" href="#" icon="search" />);

	expect(locator.getByRole('link', { name: 'Repository' }).element()).toBeTruthy();
	expect(locator.getByRole('link', { name: 'search' }).query()).toBeNull();
});

test('a custom SVG icon with no aria-hidden of its own contributes no accessible name', () => {
	const { locator } = render(
		<IconLink aria-label="Repository" href="#" icon={<UnlabelledCustomIcon />} />,
	);

	const link = locator.getByRole('link', { name: 'Repository' }).element();
	expect(link).toHaveAccessibleName('Repository');
	// The wrapper hides the whole subtree, so the custom svg needs no aria-hidden of its own.
	expect(link.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
});

test('accepts aria-label', () => {
	const { locator } = render(<IconLink aria-label="Search" href="#" icon="search" />);

	expect(locator.getByRole('link', { name: 'Search' }).element()).toBeTruthy();
});

test('accepts aria-labelledby pointing at an external element', () => {
	const { locator } = render(
		<div>
			<span id="external-label">Search</span>
			<IconLink aria-labelledby="external-label" href="#" icon="search" />
		</div>,
	);

	expect(locator.getByRole('link', { name: 'Search' }).element()).toBeTruthy();
});

test('isDisabled exposes RAC disabled state', () => {
	const { locator } = render(<IconLink aria-label="Search" href="#" icon="search" isDisabled />);
	const link = locator.getByRole('link', { name: 'Search' }).element();

	expect(link).toHaveAttribute('data-disabled', 'true');
});

// Layout is the contract here: an icon-only control's target must render as a
// square at each size, and there is no DOM/ARIA attribute that expresses that.
test('the control renders as a square at each size', () => {
	const { locator } = render(
		<div>
			<IconLink aria-label="Small" href="#" icon="search" size="small" />
			<IconLink aria-label="Medium" href="#" icon="search" size="medium" />
		</div>,
	);

	for (const name of ['Small', 'Medium']) {
		const link = locator.getByRole('link', { name }).element();
		const { height, width } = link.getBoundingClientRect();
		expect(width).toBeCloseTo(height, 0);
	}
});

test('Enter activates the link, Space does not', async () => {
	let presses = 0;
	const { locator, user } = render(
		<IconLink aria-label="Search" href="#" icon="search" onPress={() => presses++} />,
	);
	const link = locator.getByRole('link', { name: 'Search' });

	await user.tab();
	await user.keyboard(' ');
	expect(presses).toBe(0);

	await user.keyboard('{Enter}');
	expect(presses).toBe(1);

	// Same focused control both times: Space stayed inert rather than being consumed silently.
	expect(link.element()).toBe(document.activeElement);
});
