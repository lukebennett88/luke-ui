import { Link } from '@luke-ui/react/link';
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
	Stack,
} from '../test-utils/visual.js';

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

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator, unmount } = render(<LinkScene />, { appearance });
		await captureVisualAppearance(locator, 'link/kitchen-sink', appearance);
		unmount();
	}
});

test('focus-visible state', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack align="flex-start">
			<Link href="#" prominence="low">
				Destination
			</Link>
		</Stack>,
	);

	await focusViaKeyboard(page.getByRole('link', { name: 'Destination' }));
	await captureVisual(locator, 'link/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={2}>
				<Link href="#" prominence="low">
					Resting
				</Link>
				<Link href="#" isDisabled prominence="low">
					Disabled
				</Link>
			</Grid>,
		);
		await captureVisual(locator, 'link/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});

test('Link preserves intrinsic and full inline sizing', () => {
	render(
		<div style={{ inlineSize: 320 }}>
			<Link appearance="button" href="#" inlineSize="auto">
				Continue auto
			</Link>
			<Link appearance="button" href="#" inlineSize="full">
				Continue full
			</Link>
		</div>,
	);
	expect(
		page.getByRole('link', { name: 'Continue auto' }).element().getBoundingClientRect().width,
	).toBeLessThan(320);
	expect(
		page.getByRole('link', { name: 'Continue full' }).element().getBoundingClientRect().width,
	).toBe(320);
});
