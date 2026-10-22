import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { vars } from '@luke-ui/react/theme';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	pairedColors,
	resolvedColor,
	setInteractionState,
	settledSurfaceColors,
} from '../test-utils/surface-colors.js';
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

const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;

// A text Link never relies on hue alone: it stays underlined whatever its state or background.
for (const prominence of ['low', 'standard', 'high'] as const) {
	test(`a ${prominence} text Link stays underlined at rest, hover, and press`, () => {
		const { locator } = render(
			<Link href="#" prominence={prominence}>
				Destination
			</Link>,
		);
		const link = locator.getByRole('link', { name: 'Destination' }).element();
		const [rest, hover, pressed] = INTERACTION_STATES.map((state) => {
			setInteractionState(link, state);
			const styles = getComputedStyle(link);
			return {
				followsText: styles.textDecorationColor === styles.color,
				line: styles.textDecorationLine,
				style: styles.textDecorationStyle,
				thickness: styles.textDecorationThickness,
			};
		});
		const restStyle = prominence === 'low' ? 'dotted' : 'solid';

		expect(rest).toEqual({ ...rest, followsText: true, line: 'underline', style: restStyle });
		// Hover and press show without colour: a thicker, solid underline.
		expect(hover).toEqual({ ...hover, followsText: true, line: 'underline', style: 'solid' });
		expect(pressed).toEqual(hover);
		expect(hover?.thickness).not.toBe(rest?.thickness);
	});
}

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	test(`a text Link reads the surrounding surface in every state in ${name}`, () => {
		const { locator } = render(
			<>
				<Box backgroundColor="danger.solid" padding="space.8">
					<Link href="#" prominence="high">
						On solid
					</Link>
				</Box>
				<Box backgroundColor="warning.subtle" padding="space.8">
					<Link href="#" prominence="high">
						On subtle
					</Link>
				</Box>
			</>,
			{ appearance },
		);
		const onSolid = locator.getByRole('link', { name: 'On solid' }).element();
		const onSubtle = locator.getByRole('link', { name: 'On subtle' }).element();
		const solidForeground = pairedColors(onSolid, 'danger.solid').foreground;

		const actual = INTERACTION_STATES.map((state) => {
			setInteractionState(onSolid, state);
			setInteractionState(onSubtle, state);
			return {
				onSolid: settledSurfaceColors(onSolid).color,
				onSolidLine: getComputedStyle(onSolid).textDecorationLine,
				onSubtle: settledSurfaceColors(onSubtle).color,
				state,
			};
		});

		expect(actual).toEqual(
			INTERACTION_STATES.map((state) => ({
				onSolid: solidForeground.accent,
				onSolidLine: 'underline',
				onSubtle: resolvedColor(vars.color.foreground.accent[state], onSubtle),
				state,
			})),
		);
	});
}

test('a text Link stays underlined in LinkText in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Box backgroundColor="accent.solid" padding="space.8">
				<Link href="#" prominence="low">
					Destination
				</Link>
			</Box>,
		);
		const link = locator.getByRole('link', { name: 'Destination' }).element();
		const actual = INTERACTION_STATES.map((state) => {
			setInteractionState(link, state);
			const styles = getComputedStyle(link);
			return { color: styles.color, line: styles.textDecorationLine };
		});

		expect(actual).toEqual(
			INTERACTION_STATES.map(() => ({
				color: resolvedColor('LinkText', link),
				line: 'underline',
			})),
		);
	} finally {
		await emulateForcedColors('none');
	}
});
