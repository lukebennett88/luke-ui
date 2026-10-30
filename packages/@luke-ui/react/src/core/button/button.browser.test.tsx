import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { act } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { assert, expect, onTestFinished, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { INTERACTION_HOVER_TO_PRESSED_VISIBILITY } from '../../theme/contrast-policy.js';
import { oklabDeltaE } from '../../theme/scale.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from '../styles/interaction-state-layer.js';
import { watchSpinner } from '../test-utils/action-spinner.js';
import { expectAxeContrastPasses, expectNoAxeViolations } from '../test-utils/axe.js';
import { emulateReducedMotion } from '../test-utils/emulate-media.js';
import { flatAppearances, render, visualAppearances } from '../test-utils/render.js';
import { lowestRenderedTextContrast } from '../test-utils/rendered-contrast.js';
import { renderedFill } from '../test-utils/rendered-fill.js';
import type { PairedBackground } from '../test-utils/surface-colors.js';
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
	parkPointer,
	pressPointer,
	releasePointer,
	Stack,
} from '../test-utils/visual.js';

/** Intended Action spinner delay (~300ms). Kept in the test so production timing drifts fail. */
const ACTION_SPINNER_DELAY_MS = 300;

function ButtonScene() {
	return (
		<Grid columns={3}>
			<Button prominence="low">Neutral low button</Button>
			<Button>Neutral standard button</Button>
			<Button prominence="high">Neutral high button</Button>
			<Button prominence="low" tone="danger">
				Danger low button
			</Button>
			<Button tone="danger">Danger standard button</Button>
			<Button prominence="high" tone="danger">
				Danger high button
			</Button>
			<Button appearance="text" prominence="low">
				Neutral low text Button
			</Button>
			<Button appearance="text">Neutral standard text Button</Button>
			<Button appearance="text" prominence="high">
				Neutral high text Button
			</Button>
			<Button appearance="text" prominence="low" tone="danger">
				Danger low text Button
			</Button>
			<Button appearance="text" tone="danger">
				Danger standard text Button
			</Button>
			<Button isDisabled>Disabled</Button>
			<Button isPending>Standard pending</Button>
			<Button isPending prominence="high">
				High pending
			</Button>
			<Button startContent={<Icon name="add" />}>With icon</Button>
			<Button endContent={<Icon name="arrowRight" />}>With end content</Button>
		</Grid>
	);
}

test('function children receive button render state', () => {
	let received:
		| {
				isDisabled: boolean;
				isFocused: boolean;
				isFocusVisible: boolean;
				isHovered: boolean;
				isPending: boolean;
				isPressed: boolean;
		  }
		| undefined;
	const { locator } = render(
		<Button>
			{(renderProps) => {
				received = renderProps;
				return 'Action';
			}}
		</Button>,
	);

	expect(locator.getByRole('button', { name: 'Action' }).element()).toBeTruthy();
	expect(received).toEqual({
		defaultChildren: undefined,
		isDisabled: false,
		isFocused: false,
		isFocusVisible: false,
		isHovered: false,
		isPending: false,
		isPressed: false,
	});
});

test('the Button scene has no axe violations', async () => {
	const { container } = render(<ButtonScene />);

	await expectNoAxeViolations(container);
});

// The inset is the padding plus the 1px border it replaces, so the Button keeps the outer size it
// had with a border.
test('a medium Button insets its label 17px from each edge with forced colours none', () => {
	const { locator } = render(<Button size="medium">Save changes</Button>);
	const button = locator.getByRole('button', { name: 'Save changes' }).element();
	const label = button.querySelector('span');
	if (!(label instanceof HTMLElement)) throw new Error('Expected a label.');
	const buttonBox = button.getBoundingClientRect();
	const labelBox = label.getBoundingClientRect();

	expect(labelBox.left - buttonBox.left).toBeCloseTo(17, 1);
	expect(buttonBox.right - labelBox.right).toBeCloseTo(17, 1);
});

test('a text Button has the same layout styles as inline Text without control padding or sizing', () => {
	const { locator } = render(
		<div>
			<Button appearance="text">Save</Button>
			<Text>Text reference</Text>
		</div>,
	);
	const button = locator.getByRole('button', { name: 'Save' }).element();
	const styles = getComputedStyle(button);
	const textStyles = getComputedStyle(locator.getByText('Text reference').element());

	expect(styles.borderInlineStartWidth).toBe('0px');
	expect(styles.lineHeight).toBe(textStyles.lineHeight);
	expect(styles.minBlockSize).toBe('0px');
	expect(styles.paddingBlockEnd).toBe('0px');
	expect(styles.paddingBlockStart).toBe('0px');
	expect(styles.paddingInlineEnd).toBe('0px');
	expect(styles.paddingInlineStart).toBe('0px');
	expect(styles.whiteSpace).not.toBe('nowrap');
});

test('a text Button wraps with surrounding text when constrained', () => {
	const { locator } = render(
		<div style={{ inlineSize: '8rem' }}>
			<Button appearance="text">
				Use text Buttons when an action needs to wrap with surrounding text.
			</Button>
		</div>,
	);
	const button = locator.getByRole('button').element();
	const label = button.querySelector('span');
	if (!(label instanceof HTMLElement)) throw new Error('Expected a text label.');
	const container = button.parentElement;
	if (!(container instanceof HTMLElement)) throw new Error('Expected a text Button container.');

	expect(label.getClientRects().length).toBeGreaterThan(1);
	expect(button.getBoundingClientRect().height).toBeGreaterThan(
		Number.parseFloat(getComputedStyle(button).lineHeight),
	);
	expect(button.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

test('a text Button in a grid parent is not collapsed to a single character per line', () => {
	const { locator } = render(
		<div style={{ display: 'grid' }}>
			<Button appearance="text">Button</Button>
		</div>,
	);
	const button = locator.getByRole('button', { name: 'Button' }).element();
	const label = button.querySelector('span');
	if (!(label instanceof HTMLElement)) throw new Error('Expected a text label.');

	expect(label.getClientRects().length).toBe(1);
	expect(getComputedStyle(button).minInlineSize).toBe('auto');
	expect(button.getBoundingClientRect().width).toBeGreaterThan(20);
});

test('a text Button in a flex parent is not collapsed to a single character per line', () => {
	const { locator } = render(
		<div style={{ display: 'flex' }}>
			<Button appearance="text">Button</Button>
		</div>,
	);
	const button = locator.getByRole('button', { name: 'Button' }).element();
	const label = button.querySelector('span');
	if (!(label instanceof HTMLElement)) throw new Error('Expected a text label.');

	expect(label.getClientRects().length).toBe(1);
	expect(button.getBoundingClientRect().width).toBeGreaterThan(20);
});

test('runs onPress before pressAction and tracks Action pending', async () => {
	const order: Array<string> = [];
	let release: (() => void) | undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	onTestFinished(() => {
		release?.();
	});

	const { locator, user } = render(
		<Button
			onPress={() => {
				order.push('onPress');
			}}
			pressAction={async () => {
				order.push('pressAction');
				await gate;
			}}
		>
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' });

	await user.click(button);
	expect(order).toEqual(['onPress', 'pressAction']);
	expect(button.element().getAttribute('data-pending')).toBe('true');

	assert(release, 'expected the Action gate to be set');
	release();
	await expect.poll(() => button.element().getAttribute('data-pending')).toBeNull();
});

test('suppresses a same-tick second Action start', async () => {
	let starts = 0;
	let release: (() => void) | undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	onTestFinished(() => {
		release?.();
	});

	const { locator } = render(
		<Button
			pressAction={async () => {
				starts += 1;
				await gate;
			}}
		>
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' }).element();

	// userEvent awaits between presses, allowing Transition pending to commit.
	// Dispatch both presses in one act to exercise the pre-commit guard.
	act(() => {
		dispatchPress(button);
		dispatchPress(button);
	});

	expect(starts).toBe(1);
	expect(button.getAttribute('data-pending')).toBe('true');

	assert(release, 'expected the Action gate to be set');
	release();
	await expect.poll(() => button.getAttribute('data-pending')).toBeNull();
});

test('does not start pressAction when external isPending is already true', async () => {
	let started = false;
	const { locator, user } = render(
		<Button
			isPending
			pressAction={() => {
				started = true;
			}}
		>
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' });

	expect(button.element().getAttribute('data-pending')).toBe('true');
	await user.tab();
	await user.keyboard('{Enter}');
	expect(started).toBe(false);
});

test('shows no spinner for a fast Action', async () => {
	// Control both the Action's completion and the spinner-delay clock, so
	// "fast" means finished before the delay by construction, not by a
	// real-time race. Fake only the timer the spinner delay uses; Vitest's
	// browser polling and `userEvent` keep their own timer references.
	vi.useFakeTimers({
		toFake: ['setTimeout', 'clearTimeout'],
	});
	onTestFinished(() => {
		vi.useRealTimers();
	});
	let release: (() => void) | undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	onTestFinished(() => {
		release?.();
	});

	const { locator, user } = render(
		<Button
			pressAction={async () => {
				await gate;
			}}
		>
			Fast
		</Button>,
	);
	const fast = locator.getByRole('button', { name: 'Fast' });
	const spinner = watchSpinner(fast.element());

	await act(async () => {
		await user.click(fast);
	});
	expect(fast.element().getAttribute('data-pending')).toBe('true');

	// Finish before the delay elapses, then run the clock past it: a late
	// spinner would have to appear now if completion had not cancelled it.
	assert(release, 'expected the fast Action gate to be set');
	release();
	await expect.poll(() => fast.element().getAttribute('data-pending')).toBeNull();
	act(() => {
		vi.advanceTimersByTime(ACTION_SPINNER_DELAY_MS + 1);
	});
	expect(spinner.appearedAt()).toBeUndefined();
	expect(fast.element().querySelector('[role="status"]')).toBeNull();
});

test('shows a delayed spinner for a slow Action', async () => {
	// Advance a fake clock to the delay boundary instead of measuring
	// wall-clock elapsed time, which depends on machine scheduling.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	onTestFinished(() => {
		vi.useRealTimers();
	});
	let releaseSlow: (() => void) | undefined;
	const slowGate = new Promise<void>((resolve) => {
		releaseSlow = resolve;
	});
	onTestFinished(() => {
		releaseSlow?.();
	});

	const { locator, user } = render(
		<Button
			pressAction={async () => {
				await slowGate;
			}}
		>
			Slow
		</Button>,
	);
	const slow = locator.getByRole('button', { name: 'Slow' });
	const spinner = watchSpinner(slow.element());

	await act(async () => {
		await user.click(slow);
	});
	expect(slow.element().getAttribute('data-pending')).toBe('true');
	expect(spinner.appearedAt()).toBeUndefined();

	act(() => {
		vi.advanceTimersByTime(ACTION_SPINNER_DELAY_MS - 1);
	});
	expect(spinner.appearedAt()).toBeUndefined();
	expect(slow.element().querySelector('[role="status"]')).toBeNull();

	act(() => {
		vi.advanceTimersByTime(1);
	});
	await expect.poll(spinner.appearedAt).toBeDefined();

	assert(releaseSlow, 'expected the slow Action gate to be set');
	releaseSlow();
	await expect.poll(() => slow.element().getAttribute('data-pending')).toBeNull();
});

test('does not swallow Action errors', async () => {
	const { container, locator, user } = render(
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<div role="alert">{error instanceof Error ? error.message : 'Unknown error'}</div>
			)}
		>
			<Button
				pressAction={async () => {
					throw new Error('save failed');
				}}
			>
				Save
			</Button>
		</ErrorBoundary>,
	);

	await user.click(locator.getByRole('button', { name: 'Save' }));
	await expect
		.poll(() => container.querySelector('[role="alert"]')?.textContent)
		.toBe('save failed');
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<ButtonScene />, { appearance });
		await captureVisualAppearance(locator, 'button/kitchen-sink', appearance);
	}
});

test('focus-visible state', { tags: ['visual'] }, async () => {
	const { locator } = render(<Button>Action</Button>);
	const button = page.getByRole('button', { name: 'Action' });

	await focusViaKeyboard(button);
	await captureVisual(locator, 'button/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={3}>
				<Button>Action</Button>
				<Button isDisabled>Disabled</Button>
				<Button isPending>Pending</Button>
			</Grid>,
		);
		await captureVisual(locator, 'button/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});

function dispatchPress(element: Element) {
	element.dispatchEvent(
		new PointerEvent('pointerdown', {
			bubbles: true,
			button: 0,
			buttons: 1,
			cancelable: true,
			pointerId: 1,
			pointerType: 'mouse',
		}),
	);
	element.dispatchEvent(
		new PointerEvent('pointerup', {
			bubbles: true,
			button: 0,
			buttons: 0,
			cancelable: true,
			pointerId: 1,
			pointerType: 'mouse',
		}),
	);
	element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
}

test('Button preserves intrinsic and full inline sizing', () => {
	render(
		<div style={{ inlineSize: 320 }}>
			<Button inlineSize="auto">Save auto</Button>
			<Button inlineSize="full">Save full</Button>
		</div>,
	);
	expect(
		page.getByRole('button', { name: 'Save auto' }).element().getBoundingClientRect().width,
	).toBeLessThan(320);
	expect(
		page.getByRole('button', { name: 'Save full' }).element().getBoundingClientRect().width,
	).toBe(320);
});

const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;

type InteractionState = (typeof INTERACTION_STATES)[number];

const buttonFills = [
	{
		// Low Buttons stay transparent and keep the surrounding context; hover and pressed paint
		// the adaptive state layer rather than an opaque subtle fill.
		fill: (_state: InteractionState) => null,
		label: 'Neutral low',
		prominence: 'low',
		tone: 'neutral',
	},
	{
		// Standard Buttons keep the resting subtle fill; hover and pressed add the state layer.
		fill: (_state: InteractionState) => 'neutral.subtle',
		label: 'Neutral standard',
		prominence: 'standard',
		tone: 'neutral',
	},
	{
		fill: (state: InteractionState) => `accent.solid.${state}`,
		label: 'Neutral high',
		prominence: 'high',
		tone: 'neutral',
	},
	{
		fill: (_state: InteractionState) => null,
		label: 'Danger low',
		prominence: 'low',
		tone: 'danger',
	},
	{
		fill: (_state: InteractionState) => 'neutral.subtle',
		label: 'Danger standard',
		prominence: 'standard',
		tone: 'danger',
	},
	{
		fill: (state: InteractionState) => `danger.solid.${state}`,
		label: 'Danger high',
		prominence: 'high',
		tone: 'danger',
	},
] as const satisfies ReadonlyArray<{
	fill: (state: InteractionState) => PairedBackground | null;
	label: string;
	prominence: 'low' | 'standard' | 'high';
	tone: 'neutral' | 'danger';
}>;

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	// The parent is another role's solid fill. Low Buttons keep that context at rest; hover and
	// pressed paint an opaque subtle chip so on-solid text contrast stays at AA. Standard Buttons
	// keep a resting subtle pairing. High Buttons establish their own solid context.
	test(`Button fills pair with their foreground in every interaction state in ${name}`, () => {
		const { locator } = render(
			<Box backgroundColor="success.solid" data-testid="parent" padding="space.8">
				{buttonFills.map(({ label, prominence, tone }) => (
					<Button key={label} prominence={prominence} tone={tone}>
						{label}
					</Button>
				))}
			</Box>,
			{ appearance },
		);
		const parent = locator.getByTestId('parent').element();

		for (const { fill, label, prominence, tone } of buttonFills) {
			const button = locator.getByRole('button', { name: label }).element();
			const actual = INTERACTION_STATES.map((state) => {
				setInteractionState(button, state);
				return { state, ...settledSurfaceColors(button) };
			});
			const expected = INTERACTION_STATES.map((state) => {
				if (prominence === 'low' && state !== 'rest') {
					const chipText =
						tone === 'danger'
							? resolvedColor(vars.color.foreground.danger.rest, button)
							: resolvedColor(vars.color.foreground.primary, button);
					const chip =
						tone === 'danger'
							? pairedColors(button, 'danger.subtle')
							: pairedColors(button, 'neutral.subtle');
					return {
						state,
						...chip,
						background: TRANSPARENT,
						color: chipText,
					};
				}
				const background = fill(state);
				const paired =
					background === null
						? { ...pairedColors(parent, 'success.solid.rest'), background: TRANSPARENT }
						: pairedColors(button, background);
				// A danger tone reads the context's danger colour instead of its primary.
				const color = tone === 'danger' ? paired.foreground.danger : paired.color;
				return { state, ...paired, color };
			});

			expect(actual).toEqual(expected);
			const layerUsed = INTERACTION_STATES.map((state) => {
				setInteractionState(button, state);
				settledSurfaceColors(button);
				const layer = getComputedStyle(button).getPropertyValue(INTERACTION_STATE_LAYER_PROPERTY);
				return layer.trim() !== TRANSPARENT;
			});
			expect(layerUsed).toEqual([false, prominence !== 'high', prominence !== 'high']);
		}
	});

	test(`text Button colours read the surrounding surface in every state in ${name}`, () => {
		const { locator } = render(
			<>
				<Box backgroundColor="accent.solid" padding="space.8">
					<Button appearance="text" prominence="high">
						On solid
					</Button>
				</Box>
				<Box backgroundColor="success.subtle" padding="space.8">
					<Button appearance="text" prominence="low" tone="danger">
						On subtle
					</Button>
				</Box>
			</>,
			{ appearance },
		);
		const onSolid = locator.getByRole('button', { name: 'On solid' }).element();
		const onSubtle = locator.getByRole('button', { name: 'On subtle' }).element();
		const solidForeground = pairedColors(onSolid, 'accent.solid.rest').foreground;

		const actual = INTERACTION_STATES.map((state) => {
			setInteractionState(onSolid, state);
			setInteractionState(onSubtle, state);
			return {
				onSolid: settledSurfaceColors(onSolid).color,
				onSubtle: settledSurfaceColors(onSubtle).color,
				state,
			};
		});

		expect(actual).toEqual(
			INTERACTION_STATES.map((state) => ({
				onSolid: solidForeground.accent,
				onSubtle: resolvedColor(vars.color.foreground.danger[state], onSubtle),
				state,
			})),
		);
	});
}

// axe measures resting low and standard fills. Its gradient state layer reads as incomplete even
// while transparent at rest, so the test clears it to expose the fill underneath. Hover and pressed
// use `lowestRenderedTextContrast` below, as do solid Buttons and their control finish.
for (const appearance of visualAppearances) {
	const measured = buttonFills.filter(({ prominence }) => prominence !== 'high');

	test(`Button text passes axe contrast on resting transparent and subtle fills in ${appearance.theme} ${appearance.mode}`, async () => {
		const { container, locator } = render(
			<Box backgroundColor="success.solid" padding="space.8">
				{measured.map(({ label, prominence, tone }) => (
					<Button key={label} prominence={prominence} tone={tone}>
						{label}
					</Button>
				))}
			</Box>,
			{ appearance },
		);
		for (const { label } of measured) {
			const button = locator.getByRole('button', { name: label }).element();
			setInteractionState(button, 'rest');
			settledSurfaceColors(button);
			button.style.backgroundImage = 'none';
		}
		await expectAxeContrastPasses(container);
	});
}

// Measures each label against the pixels painted behind it, including the control finish, which the
// theme compiler's contrast gates do not see.
for (const appearance of [
	...visualAppearances,
	...flatAppearances,
	{ mode: 'light', theme: 'chromatic' },
	{ mode: 'dark', theme: 'chromatic' },
] as const) {
	test(`Button text keeps 4.5:1 contrast over its painted fill in every state in ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<Box backgroundColor="success.solid" padding="space.8">
				{buttonFills.map(({ label, prominence, tone }) => (
					<Button key={label} prominence={prominence} tone={tone}>
						{label}
					</Button>
				))}
			</Box>,
			{ appearance },
		);
		const buttons = buttonFills.map(({ label }) => ({
			button: locator.getByRole('button', { name: label }).element(),
			label,
		}));

		const lowContrast: Array<{ contrast: number; label: string; state: InteractionState }> = [];
		for (const state of INTERACTION_STATES) {
			for (const { button } of buttons) {
				setInteractionState(button, state);
				settledSurfaceColors(button);
			}
			for (const { button, label } of buttons) {
				assert(button instanceof HTMLElement);
				const contrast = await lowestRenderedTextContrast(button);
				if (contrast < 4.5)
					lowContrast.push({ contrast: Number(contrast.toFixed(2)), label, state });
			}
		}

		expect(lowContrast).toEqual([]);
	});
}

// A text Button is not a link, so it has no label weight. Hover and press toggle the underline: low
// gains it, and standard and high lose it.
for (const { prominence, rest, active } of [
	{ prominence: 'low', rest: 'none', active: 'underline' },
	{ prominence: 'standard', rest: 'underline', active: 'none' },
	{ prominence: 'high', rest: 'underline', active: 'none' },
] as const) {
	test(`a ${prominence} text Button toggles its underline on hover and press`, async () => {
		const { locator } = render(
			<Button appearance="text" prominence={prominence}>
				Save
			</Button>,
		);
		const button = locator.getByRole('button', { name: 'Save' }).element();
		const states = INTERACTION_STATES.map((state) => {
			setInteractionState(button, state);
			const styles = getComputedStyle(button);
			return { line: styles.textDecorationLine, thickness: styles.textDecorationThickness };
		});

		expect(states.map(({ line }) => line)).toEqual([rest, active, active]);
		expect(new Set(states.map(({ thickness }) => thickness)).size).toBe(1);

		// Keyboard focus keeps the resting underline of standard and high, and a hover still toggles it.
		setInteractionState(button, 'rest');
		await focusViaKeyboard(locator.getByRole('button', { name: 'Save' }));
		expect(getComputedStyle(button).textDecorationLine).toBe('underline');
		setInteractionState(button, 'hover');
		expect(getComputedStyle(button).textDecorationLine).toBe(active);
	});
}

for (const state of ['hover', 'pressed'] as const) {
	test(`text Button ${state}`, { tags: ['visual'] }, async () => {
		for (const appearance of visualAppearances) {
			const { locator, unmount } = render(
				<Stack align="flex-start">
					{(['low', 'standard', 'high'] as const).map((prominence) => (
						<Button appearance="text" key={prominence} prominence={prominence}>
							{`Text ${prominence}`}
						</Button>
					))}
				</Stack>,
				{ appearance },
			);
			for (const button of locator.getByRole('button').elements()) {
				setInteractionState(button, state);
			}
			try {
				await captureVisualAppearance(locator, `button/text-${state}`, appearance);
			} finally {
				unmount();
			}
		}
	});
}

for (const appearance of visualAppearances) {
	test(`text Button and text Link colours differ at low and standard prominence in ${appearance.theme} ${appearance.mode}`, () => {
		const prominences = ['low', 'standard'] as const;
		const { locator } = render(
			<>
				{prominences.map((prominence) => (
					<Box key={prominence}>
						<Button appearance="text" prominence={prominence}>
							{`Button ${prominence}`}
						</Button>
						<Link href="#" prominence={prominence}>
							{`Link ${prominence}`}
						</Link>
					</Box>
				))}
				<Button appearance="text" prominence="high">
					Button high
				</Button>
			</>,
			{ appearance },
		);
		const colours = prominences.map((prominence) => ({
			button: getComputedStyle(
				locator.getByRole('button', { name: `Button ${prominence}` }).element(),
			).color,
			link: getComputedStyle(locator.getByRole('link', { name: `Link ${prominence}` }).element())
				.color,
			prominence,
		}));
		const neutral = resolvedColor(vars.color.foreground.neutral.rest, locator.element());
		const accent = resolvedColor(vars.color.foreground.accent.rest, locator.element());

		expect(colours).toEqual([
			{ button: neutral, link: accent, prominence: 'low' },
			{ button: neutral, link: accent, prominence: 'standard' },
		]);
		expect(
			getComputedStyle(locator.getByRole('button', { name: 'Button high' }).element()).color,
		).toBe(accent);
	});
}

for (const appearance of visualAppearances) {
	test(`Buttons on a solid fill take system colours in forced colours in ${appearance.theme} ${appearance.mode}`, async () => {
		await emulateForcedColors('active');
		try {
			const { locator } = render(
				<Box backgroundColor="accent.solid" padding="space.8">
					{buttonFills.map(({ label, prominence, tone }) => (
						<Button key={label} prominence={prominence} tone={tone}>
							{label}
						</Button>
					))}
					<Button isDisabled prominence="high" tone="danger">
						Disabled delete
					</Button>
				</Box>,
				{ appearance },
			);
			for (const { label } of buttonFills) {
				const button = locator.getByRole('button', { name: label }).element();
				expect(settledSurfaceColors(button)).toMatchObject({
					background: resolvedColor('ButtonFace', button),
					color: resolvedColor('ButtonText', button),
				});
			}
			const disabled = locator.getByRole('button', { name: 'Disabled delete' }).element();
			expect(disabled).toBeDisabled();
			expect(settledSurfaceColors(disabled).color).toBe(resolvedColor('GrayText', disabled));
		} finally {
			await emulateForcedColors('none');
		}
	});
}

test('a low Button chip keeps nested contextual text at AA on a solid fill', async () => {
	const { locator } = render(
		<Box backgroundColor="accent.solid" padding="space.8">
			<Button prominence="low">
				<Text color="primary" elementType="span">
					Primary child
				</Text>
			</Button>
		</Box>,
		{ appearance: { mode: 'light', theme: 'paper' } },
	);
	const button = locator.getByRole('button', { name: 'Primary child' }).element();
	assert(button instanceof HTMLElement);

	for (const state of ['hover', 'pressed'] as const) {
		setInteractionState(button, state);
		settledSurfaceColors(button);
		expect(await lowestRenderedTextContrast(button)).toBeGreaterThanOrEqual(4.5);
	}
});

// Adaptive hover and pressed must stay visible on every standard surface, including overlays an
// application paints with `surface.raised` without going through `Box`.
const adaptiveAppearances = [
	...visualAppearances,
	{ mode: 'light', theme: 'contrastEdge' },
	{ mode: 'dark', theme: 'contrastEdge' },
] as const;

for (const appearance of adaptiveAppearances) {
	const surfaces = ['surface.base', 'surface.subdued', 'surface.raised'] as const;

	test(`low and standard Buttons keep 4.5:1 text over adaptive states on every surface in ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<>
				{surfaces.map((surface) => (
					<Box key={surface} backgroundColor={surface} data-testid={surface} padding="space.8">
						<Button prominence="low">Low on {surface}</Button>
						<Button>Standard on {surface}</Button>
						<Button prominence="low" tone="danger">
							Danger low on {surface}
						</Button>
					</Box>
				))}
			</>,
			{ appearance },
		);

		const lowContrast: Array<{
			contrast: number;
			label: string;
			state: InteractionState;
			surface: (typeof surfaces)[number];
		}> = [];
		const missingLayers: Array<{ label: string; state: InteractionState; surface: string }> = [];
		for (const surface of surfaces) {
			const region = locator.getByTestId(surface);
			const buttons = [
				region.getByRole('button', { name: `Low on ${surface}` }).element(),
				region.getByRole('button', { name: `Standard on ${surface}` }).element(),
				region.getByRole('button', { name: `Danger low on ${surface}` }).element(),
			];
			for (const state of INTERACTION_STATES) {
				for (const button of buttons) {
					setInteractionState(button, state);
					if (state !== 'rest' && getComputedStyle(button).backgroundImage === 'none') {
						missingLayers.push({
							label: button.textContent ?? '',
							state,
							surface,
						});
					}
				}
				for (const button of buttons) settledSurfaceColors(button);
				for (const button of buttons) {
					assert(button instanceof HTMLElement);
					const contrast = await lowestRenderedTextContrast(button);
					if (contrast < 4.5) {
						lowContrast.push({
							contrast: Number(contrast.toFixed(2)),
							label: button.textContent ?? '',
							state,
							surface,
						});
					}
				}
			}
		}

		expect(missingLayers).toEqual([]);
		expect(lowContrast).toEqual([]);
	});
}

const solidRoles = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'] as const;

for (const appearance of adaptiveAppearances) {
	test(`low Buttons keep a visible pressed step and 4.5:1 text inside every role solid in ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<>
				{solidRoles.map((role) => (
					<Box key={role} backgroundColor={`${role}.solid`} data-testid={role} padding="space.8">
						<Button prominence="low">Neutral low in {role}</Button>
						<Button prominence="low" tone="danger">
							Danger low in {role}
						</Button>
					</Box>
				))}
			</>,
			{ appearance },
		);
		const visibilityMisses: Array<{ role: string; tone: string; visibility: number }> = [];
		const lowContrast: Array<{
			contrast: number;
			label: string;
			role: (typeof solidRoles)[number];
			state: InteractionState;
		}> = [];
		for (const role of solidRoles) {
			const region = locator.getByTestId(role);
			for (const tone of ['Neutral', 'Danger'] as const) {
				const button = region.getByRole('button', { name: `${tone} low in ${role}` }).element();
				assert(button instanceof HTMLElement);
				for (const state of INTERACTION_STATES) {
					setInteractionState(button, state);
					settledSurfaceColors(button);
					const contrast = await lowestRenderedTextContrast(button);
					if (contrast < 4.5) {
						lowContrast.push({
							contrast: Number(contrast.toFixed(2)),
							label: button.textContent ?? '',
							role,
							state,
						});
					}
				}
				setInteractionState(button, 'hover');
				settledSurfaceColors(button);
				const hover = await renderedFill(button);
				setInteractionState(button, 'pressed');
				settledSurfaceColors(button);
				const pressed = await renderedFill(button);
				const visibility = oklabDeltaE(hover, pressed);
				if (visibility < INTERACTION_HOVER_TO_PRESSED_VISIBILITY) {
					visibilityMisses.push({ role, tone, visibility: Number(visibility.toFixed(3)) });
				}
			}
		}

		expect(visibilityMisses).toEqual([]);
		expect(lowContrast).toEqual([]);
	});
}

test('forced colours clear the adaptive state layer on a low Button', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(<Button prominence="low">Cancel</Button>);
		const button = locator.getByRole('button', { name: 'Cancel' }).element();
		setInteractionState(button, 'hover');
		expect(getComputedStyle(button).backgroundImage).toBe('none');
	} finally {
		await emulateForcedColors('none');
	}
});

for (const appearance of visualAppearances) {
	test(`forced colours remove the control finish from a solid Button in every state in ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(<Button prominence="high">Save</Button>, { appearance });
		const button = locator.getByRole('button', { name: 'Save' }).element();
		const finishes = INTERACTION_STATES.map((state) => {
			setInteractionState(button, state);
			return getComputedStyle(button).backgroundImage;
		});
		// Guards the assertion below: outside forced colours Tactile paints its finish and Paper has none.
		expect(finishes.includes('none')).toBe(appearance.theme === 'paper');

		await emulateForcedColors('active');
		try {
			for (const state of INTERACTION_STATES) {
				setInteractionState(button, state);
				// A list of `none` layers paints nothing.
				expect(getComputedStyle(button).backgroundImage).toMatch(/^none(, none)*$/);
			}
		} finally {
			await emulateForcedColors('none');
		}
	});

	test(`reduced motion keeps the solid Button hover and pressed states visible in ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(<Button prominence="high">Save</Button>, { appearance });
		const button = locator.getByRole('button', { name: 'Save' }).element();
		await emulateReducedMotion(true);
		try {
			const painted = INTERACTION_STATES.map((state) => {
				setInteractionState(button, state);
				// Reduced motion keeps colour changes. Settle them to read the painted state.
				const { background } = settledSurfaceColors(button);
				return `${background} ${getComputedStyle(button).backgroundImage}`;
			});
			const [rest, hover, pressed] = painted;

			expect(hover).not.toBe(rest);
			expect(pressed).not.toBe(hover);
		} finally {
			await emulateReducedMotion(false);
		}
	});
}

test('adaptive Button layer transitions normally and changes immediately with reduced motion', async () => {
	const { locator } = render(<Button prominence="low">Cancel</Button>);
	const button = locator.getByRole('button', { name: 'Cancel' }).element();
	const layerProperty = INTERACTION_STATE_LAYER_PROPERTY;
	const layerTransitioning = () => {
		return button.getAnimations().some((animation) => {
			return animation instanceof CSSTransition && animation.transitionProperty === layerProperty;
		});
	};
	getComputedStyle(button);
	setInteractionState(button, 'hover');
	await expect.poll(layerTransitioning).toBe(true);
	settledSurfaceColors(button);
	setInteractionState(button, 'rest');
	await expect.poll(layerTransitioning).toBe(true);
	settledSurfaceColors(button);
	await emulateReducedMotion(true);
	try {
		setInteractionState(button, 'pressed');
		const style = getComputedStyle(button);
		expect(style.transitionProperty).not.toContain(layerProperty);
		expect(style.getPropertyValue(layerProperty)).toBe(
			resolvedColor('var(--luke-interaction-tint-pressed)', button),
		);
		expect(layerTransitioning()).toBe(false);
	} finally {
		await emulateReducedMotion(false);
	}
});

for (const appearance of visualAppearances) {
	test(`pointer and keyboard input paint adaptive hover and pressed states in ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator, user } = render(
			<div
				style={{
					backgroundColor: vars.color.background.surface.raised,
					color: vars.color.foreground.primary,
					padding: vars.space['16'],
				}}
			>
				<Button prominence="low">Cancel</Button>
			</div>,
			{ appearance },
		);
		const target = locator.getByRole('button', { name: 'Cancel' });
		const button = target.element();
		assert(button instanceof HTMLElement);
		await parkPointer();
		settledSurfaceColors(button);
		const rest = await renderedFill(button);
		await user.hover(target);
		await expect.poll(() => button.hasAttribute('data-hovered')).toBe(true);
		settledSurfaceColors(button);
		const hover = await renderedFill(button);
		await pressPointer(button);
		try {
			await expect.poll(() => button.hasAttribute('data-pressed')).toBe(true);
			settledSurfaceColors(button);
			const pressed = await renderedFill(button);
			expect(oklabDeltaE(rest, hover)).toBeGreaterThan(0);
			expect(oklabDeltaE(hover, pressed)).toBeGreaterThanOrEqual(
				INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
			);
		} finally {
			await releasePointer();
		}
		await parkPointer();
		button.blur();
		await focusViaKeyboard(target);
		await user.keyboard('[Space>]');
		try {
			await expect.poll(() => button.hasAttribute('data-pressed')).toBe(true);
			settledSurfaceColors(button);
			const keyboardPressed = await renderedFill(button);
			expect(oklabDeltaE(hover, keyboardPressed)).toBeGreaterThanOrEqual(
				INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
			);
		} finally {
			await user.keyboard('[/Space]');
		}
	});
}

test('kitchen sink on overlay', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<div
				style={{
					backgroundColor: vars.color.background.surface.raised,
					color: vars.color.foreground.primary,
					padding: vars.space['16'],
				}}
			>
				<Grid columns={3}>
					<Button prominence="low">Cancel</Button>
					<Button>Standard</Button>
					<Button prominence="high">Save</Button>
					<Button prominence="low" tone="danger">
						Delete
					</Button>
					<Button tone="danger">Danger standard</Button>
					<Button prominence="high" tone="danger">
						Danger high
					</Button>
				</Grid>
			</div>,
			{ appearance },
		);
		const cancel = locator.getByRole('button', { name: 'Cancel' }).element();
		const standard = locator.getByRole('button', { name: 'Standard' }).element();
		setInteractionState(cancel, 'hover');
		setInteractionState(standard, 'pressed');
		await captureVisualAppearance(locator, 'button/overlay-adaptive-states', appearance);
	}
});
