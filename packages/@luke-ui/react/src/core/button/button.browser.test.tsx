import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { act, createRef } from 'react';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
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

/** Intended Action spinner delay (~300ms). Kept in the test so production timing drifts fail. */
const ACTION_SPINNER_DELAY_MS = 300;

/**
 * The representative scene, shared by the axe check and the visual capture so
 * both cover the same surface.
 */
function ButtonScene() {
	return (
		<Grid columns={3}>
			<Button prominence="low">Neutral low button</Button>
			<Button>Neutral standard button</Button>
			<Button prominence="high">Neutral high button</Button>
			<Button tone="critical" prominence="low">
				Critical low button
			</Button>
			<Button tone="critical">Critical standard button</Button>
			<Button tone="critical" prominence="high">
				Critical high button
			</Button>
			<Button appearance="text" prominence="low">
				Neutral low text Button
			</Button>
			<Button appearance="text">Neutral standard text Button</Button>
			<Button appearance="text" prominence="high">
				Neutral high text Button
			</Button>
			<Button appearance="text" tone="critical" prominence="low">
				Critical low text Button
			</Button>
			<Button appearance="text" tone="critical">
				Critical standard text Button
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

/**
 * React 19 passes `ref` as an ordinary prop and these components spread it
 * through to the React Aria element, so ref forwarding works at runtime. React
 * Aria's own prop types never declare `ref`, so the public props type cannot
 * express it; this alias adds it back for the DOM-contract test below.
 */
const ButtonWithRef = Button as (
	props: ComponentProps<typeof Button> & { ref?: Ref<HTMLButtonElement> },
) => ReactNode;

test('Button forwards className, data attributes, id, and ref to the button element', () => {
	const ref = createRef<HTMLButtonElement>();
	const { locator } = render(
		<ButtonWithRef className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Action
		</ButtonWithRef>,
	);
	const button = locator.getByRole('button').element();

	expectForwardsDomProps(button, ref);
});

test('pressing a Button runs its onPress handler', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Action</Button>);

	await user.click(locator.getByRole('button', { name: 'Action' }));
	expect(pressed).toBe(true);
});

test('the Button scene has no axe violations', async () => {
	const { container } = render(<ButtonScene />);

	await expectNoAxeViolations(container);
});

test('a text-appearance Button keeps button semantics and runs onPress', async () => {
	let pressed = false;
	const { locator, user } = render(
		<Button appearance="text" onPress={() => (pressed = true)}>
			Action
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Action' }).element();

	expect(button.tagName).toBe('BUTTON');

	await user.click(locator.getByRole('button', { name: 'Action' }));
	expect(pressed).toBe(true);
});

test('a pending text Button shows a spinner', () => {
	const { locator } = render(
		<Button appearance="text" isPending>
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' });

	expect(button.element().getAttribute('data-pending')).toBe('true');
	expect(button.element().querySelector('[role="status"]')).not.toBeNull();
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
	expect(styles.fontFamily).toBe(textStyles.fontFamily);
	expect(styles.fontSize).toBe(textStyles.fontSize);
	expect(styles.fontWeight).toBe(textStyles.fontWeight);
	expect(styles.letterSpacing).toBe(textStyles.letterSpacing);
	expect(styles.lineHeight).toBe(textStyles.lineHeight);
	expect(styles.minBlockSize).toBe('0px');
	expect(styles.overflowWrap).toBe(textStyles.overflowWrap);
	expect(styles.paddingBlockEnd).toBe('0px');
	expect(styles.paddingBlockStart).toBe('0px');
	expect(styles.paddingInlineEnd).toBe('0px');
	expect(styles.paddingInlineStart).toBe('0px');
	expect(styles.textTransform).toBe(textStyles.textTransform);
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

test('hover inverts the text Button underline, and low prominence reverses the rest state', () => {
	const { locator } = render(
		<div>
			<Button appearance="text" prominence="low">
				Low
			</Button>
			<Button appearance="text" prominence="standard">
				Standard
			</Button>
			<Button appearance="text" prominence="high">
				High
			</Button>
		</div>,
	);
	const low = locator.getByRole('button', { name: 'Low' }).element();
	const standard = locator.getByRole('button', { name: 'Standard' }).element();
	const high = locator.getByRole('button', { name: 'High' }).element();

	for (const button of [low, standard, high]) {
		button.style.transition = 'none';
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
			<Button appearance="text" prominence="low">
				Low
			</Button>
			<Button appearance="text" prominence="standard">
				Standard
			</Button>
		</div>,
	);
	const low = locator.getByRole('button', { name: 'Low' }).element();
	const standard = locator.getByRole('button', { name: 'Standard' }).element();
	const lowLabel = low.querySelector('span');
	const standardLabel = standard.querySelector('span');
	if (!(lowLabel instanceof HTMLElement) || !(standardLabel instanceof HTMLElement)) {
		throw new Error('Expected text labels.');
	}

	for (const button of [low, standard]) {
		button.style.transition = 'none';
	}

	low.setAttribute('data-focus-visible', 'true');
	low.setAttribute('data-hovered', 'true');
	standard.setAttribute('data-focus-visible', 'true');
	standard.setAttribute('data-hovered', 'true');

	expect(getComputedStyle(low).textDecorationLine).toBe('underline');
	expect(getComputedStyle(lowLabel).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standard).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standardLabel).textDecorationLine).toBe('underline');

	low.removeAttribute('data-hovered');
	standard.removeAttribute('data-hovered');
	low.setAttribute('data-pressed', 'true');
	standard.setAttribute('data-pressed', 'true');

	expect(getComputedStyle(low).textDecorationLine).toBe('underline');
	expect(getComputedStyle(lowLabel).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standard).textDecorationLine).toBe('underline');
	expect(getComputedStyle(standardLabel).textDecorationLine).toBe('underline');
});

test('the text Button label paints the underline set on the button', () => {
	const { locator } = render(
		<Button appearance="text" prominence="standard">
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' }).element();
	const label = button.querySelector('span');
	if (!(label instanceof HTMLElement)) throw new Error('Expected a text label.');

	// `text-decoration` does not inherit, so a label that sets its own value paints over the button's.
	expect(getComputedStyle(label).textDecorationLine).toBe('underline');
});

test('pressed text Buttons shift to a perceptibly different foreground colour per tone', () => {
	const { locator } = render(
		<div>
			<Button appearance="text">Neutral</Button>
			<Button appearance="text" tone="critical">
				Critical
			</Button>
			<Button appearance="text" prominence="high">
				Accent
			</Button>
		</div>,
	);
	const neutral = locator.getByRole('button', { name: 'Neutral' }).element();
	const critical = locator.getByRole('button', { name: 'Critical' }).element();
	const accent = locator.getByRole('button', { name: 'Accent' }).element();

	for (const button of [neutral, critical, accent]) {
		// A computed colour read mid-transition returns the rest value.
		button.style.transition = 'none';
	}

	const neutralRest = getComputedStyle(neutral).color;
	const criticalRest = getComputedStyle(critical).color;
	const accentRest = getComputedStyle(accent).color;

	neutral.setAttribute('data-pressed', 'true');
	critical.setAttribute('data-pressed', 'true');
	accent.setAttribute('data-pressed', 'true');

	expect(getComputedStyle(neutral).color).not.toBe(neutralRest);
	expect(getComputedStyle(critical).color).not.toBe(criticalRest);
	expect(getComputedStyle(accent).color).not.toBe(accentRest);
});

test('disabled Buttons expose disabled state in either appearance', () => {
	const { locator } = render(
		<div>
			<Button isDisabled>Button appearance</Button>
			<Button appearance="text" isDisabled>
				Text appearance
			</Button>
		</div>,
	);

	const buttonAppearance = locator.getByRole('button', { name: 'Button appearance' }).element();
	const textAppearance = locator.getByRole('button', { name: 'Text appearance' }).element();
	expect(buttonAppearance).toHaveAttribute('data-disabled', 'true');
	expect(textAppearance).toHaveAttribute('data-disabled', 'true');
});

test('runs onPress before pressAction and tracks Action pending', async () => {
	const order: Array<string> = [];
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
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
	expect(button.element().querySelector('[role="status"]')).toBeNull();

	release();
	await expect.poll(() => button.element().getAttribute('data-pending')).toBeNull();
});

test('suppresses a same-tick second Action start', async () => {
	let starts = 0;
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
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
	const { locator, user } = render(<Button pressAction={async () => {}}>Fast</Button>);
	const fast = locator.getByRole('button', { name: 'Fast' });

	await user.click(fast);
	await expect.poll(() => fast.element().getAttribute('data-pending')).toBeNull();
	await delay(ACTION_SPINNER_DELAY_MS + 100);
	expect(fast.element().querySelector('[role="status"]')).toBeNull();
});

test('shows a delayed spinner for a slow Action', async () => {
	let releaseSlow!: () => void;
	const slowGate = new Promise<void>((resolve) => {
		releaseSlow = resolve;
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

	await user.click(slow);
	expect(slow.element().getAttribute('data-pending')).toBe('true');
	expect(slow.element().querySelector('[role="status"]')).toBeNull();

	await delay(ACTION_SPINNER_DELAY_MS - 50);
	expect(slow.element().querySelector('[role="status"]')).toBeNull();

	await delay(150);
	expect(slow.element().querySelector('[role="status"]')).not.toBeNull();

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

test('interactive states', { tags: ['visual'] }, async () => {
	const { locator } = render(<Button>Action</Button>);
	const button = page.getByRole('button', { name: 'Action' });

	await userEvent.hover(button);
	await captureVisual(locator, 'button/hover');
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await captureVisual(locator, 'button/focus-visible');
	await userEvent.keyboard('{Space>}');
	await captureVisual(locator, 'button/pressed');
	await userEvent.keyboard('{/Space}');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={3}>
				<Button>Action</Button>
				<Button isDisabled>Disabled</Button>
				<Button isPending>Pending</Button>
			</Grid>,
		);
		const action = page.getByRole('button', { name: 'Action' });

		await captureVisual(locator, 'button/forced-colors-resting');
		await userEvent.hover(action);
		await captureVisual(locator, 'button/forced-colors-hover');
		await userEvent.unhover(action);
		await focusViaKeyboard(action);
		await captureVisual(locator, 'button/forced-colors-focus-visible');
		await userEvent.keyboard('{Space>}');
		await captureVisual(locator, 'button/forced-colors-pressed');
		await userEvent.keyboard('{/Space}');
	} finally {
		await emulateForcedColors('none');
	}
});

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

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
