import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectAxeContrastPasses, expectNoAxeViolations } from '../test-utils/axe.js';
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

for (const prominence of ['low', 'standard', 'high'] as const) {
	test(`a ${prominence} text Link has weight 500 and solid underlines in its active states`, async () => {
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
				fontWeight: styles.fontWeight,
				line: styles.textDecorationLine,
				style: styles.textDecorationStyle,
				thickness: styles.textDecorationThickness,
			};
		});
		const restLine = prominence === 'low' ? 'none' : 'underline';

		expect(rest).toEqual({
			...rest,
			followsText: true,
			fontWeight: '500',
			line: restLine,
			style: 'solid',
		});
		// Hover and press show without colour: a thicker, solid underline.
		expect(hover).toEqual({
			...hover,
			followsText: true,
			fontWeight: '500',
			line: 'underline',
			style: 'solid',
		});
		expect(pressed).toEqual(hover);
		expect(hover?.thickness).not.toBe(rest?.thickness);

		setInteractionState(link, 'rest');
		await focusViaKeyboard(locator.getByRole('link', { name: 'Destination' }));
		const focused = getComputedStyle(link);
		expect(focused.fontWeight).toBe('500');
		expect(focused.textDecorationLine).toBe('underline');
		expect(focused.textDecorationStyle).toBe('solid');
	});
}

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	test(`a text Link reads the surrounding surface in every state in ${name}`, async () => {
		const { container, locator } = render(
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
		await expectAxeContrastPasses(container);

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

test('a low text Link uses LinkText and underlines active states in forced colours', async () => {
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
			INTERACTION_STATES.map((state) => ({
				color: resolvedColor('LinkText', link),
				line: state === 'rest' ? 'none' : 'underline',
			})),
		);
	} finally {
		await emulateForcedColors('none');
	}
});

// #899 asks text Links to stay underlined at rest. Low prominence is the agreed exception: at rest it
// has no underline and stands out from the body text around it by weight instead. On a solid fill
// its colour matches that text, so weight is the only resting cue there.
const LOW_LINK_BACKGROUNDS = ['surface.base', 'accent.subtle', 'accent.solid'] as const;

/** The resting cues that separate a low Link from the body text around it. */
function lowLinkCues(paragraph: Element, link: Element) {
	const text = getComputedStyle(paragraph);
	const styles = getComputedStyle(link);
	return {
		heavierBy: Number(styles.fontWeight) - Number(text.fontWeight),
		line: styles.textDecorationLine,
		sameColourAsText: styles.color === text.color,
	};
}

for (const appearance of visualAppearances) {
	test(`a low Link stands out from body text by weight on every background in ${appearance.theme} ${appearance.mode}`, () => {
		const { locator } = render(
			<>
				{LOW_LINK_BACKGROUNDS.map((background) => (
					<Box backgroundColor={background} key={background} padding="space.8">
						<Text data-testid={background} elementType="p">
							Read the{' '}
							<Link href="#" prominence="low">
								{`destination on ${background}`}
							</Link>{' '}
							for details.
						</Text>
					</Box>
				))}
			</>,
			{ appearance },
		);
		const cues = LOW_LINK_BACKGROUNDS.map((background) => {
			const paragraph = locator.getByTestId(background).element();
			const link = locator.getByRole('link', { name: `destination on ${background}` }).element();
			const rest = lowLinkCues(paragraph, link);
			const activeLines = (['hover', 'pressed', 'focus'] as const).map((state) => {
				if (state === 'focus') {
					setInteractionState(link, 'rest');
					link.setAttribute('data-focus-visible', 'true');
				} else {
					setInteractionState(link, state);
				}
				const line = getComputedStyle(link).textDecorationLine;
				link.removeAttribute('data-focus-visible');
				return line;
			});
			setInteractionState(link, 'rest');
			return {
				activeLines,
				background,
				heavier: rest.heavierBy >= 100,
				line: rest.line,
				sameColourAsText: rest.sameColourAsText,
			};
		});

		expect(cues).toEqual(
			LOW_LINK_BACKGROUNDS.map((background) => ({
				activeLines: ['underline', 'underline', 'underline'],
				background,
				heavier: true,
				line: 'none',
				sameColourAsText: background === 'accent.solid',
			})),
		);
	});
}

test('a low Link on a solid fill keeps its weight and system link colour in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Box backgroundColor="accent.solid" padding="space.8">
				<Text data-testid="paragraph" elementType="p">
					Read the{' '}
					<Link href="#" prominence="low">
						destination
					</Link>{' '}
					for details.
				</Text>
			</Box>,
		);
		const paragraph = locator.getByTestId('paragraph').element();
		const link = locator.getByRole('link', { name: 'destination' }).element();
		const cues = lowLinkCues(paragraph, link);

		expect({
			color: getComputedStyle(link).color,
			heavier: cues.heavierBy >= 100,
			sameColourAsText: cues.sameColourAsText,
		}).toEqual({
			color: resolvedColor('LinkText', link),
			heavier: true,
			sameColourAsText: false,
		});
	} finally {
		await emulateForcedColors('none');
	}
});
