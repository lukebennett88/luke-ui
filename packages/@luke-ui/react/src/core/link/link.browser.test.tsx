import { Link } from '@luke-ui/react/link';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
	Stack,
} from '../test-utils/visual.js';

/**
 * The representative scene, shared by the axe check and the visual capture so
 * both cover the same surface.
 */
function LinkScene() {
	return (
		<Stack align="flex-start">
			<Link href="#" prominence="low">
				Text low
			</Link>
			<Link href="#">Text standard</Link>
			<Link href="#" prominence="high">
				Text high
			</Link>
			<Grid columns={4}>
				<Link appearance="button" href="#" prominence="low">
					Button low
				</Link>
				<Link appearance="button" href="#">
					Button standard
				</Link>
				<Link appearance="button" href="#" prominence="high">
					Button high
				</Link>
			</Grid>
			<Link href="#" isDisabled>
				Disabled text link
			</Link>
			<Link appearance="button" href="#" isDisabled prominence="high">
				Disabled button link
			</Link>
		</Stack>
	);
}

/**
 * React 19 passes `ref` as an ordinary prop and these components spread it
 * through to the React Aria element, so ref forwarding works at runtime. React
 * Aria's own prop types never declare `ref`, so the public props type cannot
 * express it; this alias adds it back for the DOM-contract test below.
 */
const LinkWithRef = Link as (
	props: ComponentProps<typeof Link> & { ref?: Ref<HTMLAnchorElement> },
) => ReactNode;

test('Link forwards className, data attributes, id, and ref to the anchor element', () => {
	const ref = createRef<HTMLAnchorElement>();
	const { locator } = render(
		<LinkWithRef
			className="forwarded-class"
			data-forwarded="true"
			href="#"
			id="forwarded-id"
			ref={ref}
		>
			Settings
		</LinkWithRef>,
	);
	const target = locator.getByRole('link', { name: 'Settings' }).element();

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});

test('pressing a Link runs its onPress handler', async () => {
	let pressed = false;
	const { locator, user } = render(
		<Link href="#" onPress={() => (pressed = true)}>
			Settings
		</Link>,
	);

	await user.click(locator.getByRole('link', { name: 'Settings' }));
	expect(pressed).toBe(true);
});

test('the Link scene has no axe violations', async () => {
	const { container } = render(<LinkScene />);

	await expectNoAxeViolations(container);
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

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<LinkScene />, { appearance });
		await captureVisualAppearance(locator, 'link/kitchen-sink', appearance);
	}
});

test('interactive states', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack align="flex-start">
			<Link href="#" prominence="low">
				Destination
			</Link>
		</Stack>,
	);
	const link = page.getByRole('link', { name: 'Destination' });

	await userEvent.hover(link);
	await captureVisual(locator, 'link/hover');
	await userEvent.unhover(link);
	await focusViaKeyboard(link);
	await captureVisual(locator, 'link/focus-visible');
	await userEvent.keyboard('{Enter>}');
	await captureVisual(locator, 'link/pressed');
	await userEvent.keyboard('{/Enter}');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={4}>
				<Link href="#" prominence="low">
					Resting
				</Link>
				<Link href="#" prominence="low">
					Hovered
				</Link>
				<Link href="#" prominence="low">
					Pressed and focused
				</Link>
				<Link href="#" isDisabled prominence="low">
					Disabled
				</Link>
			</Grid>,
		);
		const hovered = page.getByRole('link', { name: 'Hovered' });

		await userEvent.hover(hovered);
		await userEvent.tab();
		await userEvent.tab();
		await userEvent.tab();
		await userEvent.keyboard('{Enter>}');
		await captureVisual(locator, 'link/forced-colors-states');
		await userEvent.keyboard('{/Enter}');
	} finally {
		await emulateForcedColors('none');
	}
});
