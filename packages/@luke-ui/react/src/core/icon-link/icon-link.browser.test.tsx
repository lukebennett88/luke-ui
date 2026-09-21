import { IconLink } from '@luke-ui/react/icon-link';
import { createRef } from 'react';
import type { ComponentProps, JSX, ReactNode, Ref } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectForwardsDomProps } from '../test-utils/forwarding.js';
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

/**
 * The representative scene, shared by the axe check and the visual capture so
 * both cover the same surface.
 */
function IconLinkScene() {
	return (
		<Grid columns={4}>
			<IconLink aria-label="Add small" href="#" icon="add" size="small" />
			<IconLink aria-label="Add medium" href="#" icon="add" size="medium" />
			<IconLink aria-label="Disabled" href="#" icon="delete" isDisabled size="small" />
			<IconLink aria-label="Custom icon" href="#" icon={<CustomStarIcon />} />
			<IconLink aria-label="Standard" href="#" icon="add" />
			<IconLink aria-label="Low" href="#" icon="add" prominence="low" />
			<IconLink aria-label="High" href="#" icon="add" prominence="high" />
		</Grid>
	);
}

/**
 * React 19 passes `ref` as an ordinary prop and these components spread it
 * through to the React Aria element, so ref forwarding works at runtime. React
 * Aria's own prop types never declare `ref`, so the public props type cannot
 * express it; this alias adds it back for the DOM-contract test below.
 */
const IconLinkWithRef = IconLink as (
	props: ComponentProps<typeof IconLink> & { ref?: Ref<HTMLAnchorElement> },
) => ReactNode;

test('IconLink forwards className, data attributes, id, and ref to the anchor element', () => {
	const ref = createRef<HTMLAnchorElement>();
	const { locator } = render(
		<IconLinkWithRef
			aria-label="Search"
			className="forwarded-class"
			data-forwarded="true"
			href="#"
			icon="search"
			id="forwarded-id"
			ref={ref}
		/>,
	);
	const target = locator.getByRole('link', { name: 'Search' }).element();

	expectForwardsDomProps(target, ref);
});

test('pressing an IconLink runs its onPress handler', async () => {
	let pressed = false;
	const { locator, user } = render(
		<IconLink aria-label="Search" href="#" icon="search" onPress={() => (pressed = true)} />,
	);

	await user.click(locator.getByRole('link', { name: 'Search' }));
	expect(pressed).toBe(true);
});

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

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<IconLinkScene />, { appearance });
		await captureVisualAppearance(locator, 'icon-link/kitchen-sink', appearance);
	}
});

test('interactive states', { tags: ['visual'] }, async () => {
	const { locator } = render(<IconLink aria-label="Search" href="#" icon="search" />);
	const link = page.getByRole('link', { name: 'Search' });

	await userEvent.hover(link);
	await captureVisual(locator, 'icon-link/hover');
	await userEvent.unhover(link);
	await focusViaKeyboard(link);
	await captureVisual(locator, 'icon-link/focus-visible');
	await userEvent.keyboard('{Enter>}');
	await captureVisual(locator, 'icon-link/pressed');
	await userEvent.keyboard('{/Enter}');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={2}>
				<IconLink aria-label="Search" href="#" icon="search" />
				<IconLink aria-label="Disabled" href="#" icon="delete" isDisabled />
			</Grid>,
		);
		const search = page.getByRole('link', { name: 'Search' });

		await captureVisual(locator, 'icon-link/forced-colors-resting');
		await userEvent.hover(search);
		await captureVisual(locator, 'icon-link/forced-colors-hover');
		await userEvent.unhover(search);
		await focusViaKeyboard(search);
		await captureVisual(locator, 'icon-link/forced-colors-focus-visible');
		await userEvent.keyboard('{Enter>}');
		await captureVisual(locator, 'icon-link/forced-colors-pressed');
		await userEvent.keyboard('{/Enter}');
	} finally {
		await emulateForcedColors('none');
	}
});
