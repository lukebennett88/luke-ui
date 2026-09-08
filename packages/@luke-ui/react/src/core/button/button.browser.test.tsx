import { act } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { expect, test } from 'vite-plus/test';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { ACTION_SPINNER_DELAY } from '../use-press-action/use-press-action.js';
import { Button } from './button.js';

testConformance({
	path: 'button',
	getTarget: (result) => {
		const target = result.locator.getByRole('button').element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected a button.');
		return target;
	},
	render: (props = {}) => {
		return render(<Button {...props}>Action</Button>);
	},
});

testIntegration('button', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Action</Button>);

	await user.click(locator.getByRole('button', { name: 'Action' }));
	// The assertion belongs to the journey registered by testIntegration.
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
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

	// Two press sequences in one act, before React commits Transition pending.
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
	const { locator } = render(
		<Button
			isPending
			pressAction={() => {
				started = true;
			}}
		>
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' }).element();

	expect(button.getAttribute('data-pending')).toBe('true');
	act(() => {
		dispatchPress(button);
	});
	expect(started).toBe(false);
});

test('shows no spinner for a fast Action', async () => {
	const { locator, user } = render(<Button pressAction={async () => {}}>Fast</Button>);
	const fast = locator.getByRole('button', { name: 'Fast' });

	await user.click(fast);
	await expect.poll(() => fast.element().getAttribute('data-pending')).toBeNull();
	await delay(ACTION_SPINNER_DELAY + 50);
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

	await delay(ACTION_SPINNER_DELAY + 50);
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
