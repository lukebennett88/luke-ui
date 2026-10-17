import { IconLink } from '@luke-ui/react/icon-link';
import type { JSX } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
} from '../test-utils/visual.js';

/** A custom SVG that deliberately omits its own `aria-hidden` and any `<title>`. */
function UnlabelledCustomIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="8" fill="currentColor" />
		</svg>
	);
}

function CustomStarIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M12 2 14.9 9.1 22 9.9 16.7 14.9 18.2 22 12 18.3 5.8 22 7.3 14.9 2 9.9 9.1 9.1Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function IconLinkScene() {
	return (
		<Grid columns={4}>
			<IconLink aria-label="Add small" href="#" icon="add" size="px32" />
			<IconLink aria-label="Add medium" href="#" icon="add" size="px40" />
			<IconLink aria-label="Disabled" href="#" icon="delete" isDisabled size="px32" />
			<IconLink aria-label="Custom icon" href="#" icon={<CustomStarIcon />} />
			<IconLink aria-label="Standard" href="#" icon="add" />
			<IconLink aria-label="Low" href="#" icon="add" prominence="low" />
			<IconLink aria-label="High" href="#" icon="add" prominence="high" />
		</Grid>
	);
}

test('the IconLink scene has no axe violations', async () => {
	const { container } = render(<IconLinkScene />);

	await expectNoAxeViolations(container);
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

// Layout is the contract here: an icon-only control's target must render as a
// square at each size, and there is no DOM/ARIA attribute that expresses that.
test('the control renders as a square at each size', () => {
	const { locator } = render(
		<div>
			<IconLink aria-label="Small" href="#" icon="search" size="px32" />
			<IconLink aria-label="Medium" href="#" icon="search" size="px40" />
		</div>,
	);

	for (const name of ['Small', 'Medium']) {
		const link = locator.getByRole('link', { name }).element();
		const { height, width } = link.getBoundingClientRect();
		expect(width).toBeCloseTo(height, 0);
	}
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<IconLinkScene />, { appearance });
		await captureVisualAppearance(locator, 'icon-link/kitchen-sink', appearance);
	}
});

test('focus-visible state', { tags: ['visual'] }, async () => {
	const { locator } = render(<IconLink aria-label="Search" href="#" icon="search" />);

	await focusViaKeyboard(page.getByRole('link', { name: 'Search' }));
	await captureVisual(locator, 'icon-link/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={2}>
				<IconLink aria-label="Search" href="#" icon="search" />
				<IconLink aria-label="Disabled" href="#" icon="delete" isDisabled />
			</Grid>,
		);
		await captureVisual(locator, 'icon-link/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});
