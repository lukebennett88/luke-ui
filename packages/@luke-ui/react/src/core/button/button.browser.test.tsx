import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { act } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { assert, expect, onTestFinished, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { watchSpinner } from '../test-utils/action-spinner.js';
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
