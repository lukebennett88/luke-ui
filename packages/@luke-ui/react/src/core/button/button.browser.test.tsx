import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { act } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { expect, onTestFinished, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectDelayedSpinner, watchSpinner } from '../test-utils/action-spinner.js';
import { expectNoAxeViolations } from '../test-utils/axe.js';
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

function ButtonScene() {
	return (
		<Grid columns={3}>
			<Button prominence="low">Neutral low button</Button>
			<Button>Neutral standard button</Button>
			<Button prominence="high">Neutral high button</Button>
			<Button prominence="low" tone="critical">
				Critical low button
			</Button>
			<Button tone="critical">Critical standard button</Button>
			<Button prominence="high" tone="critical">
				Critical high button
			</Button>
			<Button appearance="text" prominence="low">
				Neutral low text Button
			</Button>
			<Button appearance="text">Neutral standard text Button</Button>
			<Button appearance="text" prominence="high">
				Neutral high text Button
			</Button>
			<Button appearance="text" prominence="low" tone="critical">
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

test('runs onPress before pressAction and tracks Action pending', async () => {
	const order: Array<string> = [];
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	onTestFinished(release);

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

	release();
	await expect.poll(() => button.element().getAttribute('data-pending')).toBeNull();
});

test('suppresses a same-tick second Action start', async () => {
	let starts = 0;
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	onTestFinished(release);

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
	let startedAt: number | undefined;
	let releaseSlow!: () => void;
	const slowGate = new Promise<void>((resolve) => {
		releaseSlow = resolve;
	});
	onTestFinished(releaseSlow);

	const { locator, user } = render(
		<Button
			pressAction={async () => {
				startedAt = performance.now();
				await slowGate;
			}}
		>
			Slow
		</Button>,
	);
	const slow = locator.getByRole('button', { name: 'Slow' });
	const spinner = watchSpinner(slow.element());

	await user.click(slow);
	expect(slow.element().getAttribute('data-pending')).toBe('true');

	await expectDelayedSpinner(spinner, () => startedAt, ACTION_SPINNER_DELAY_MS);

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
