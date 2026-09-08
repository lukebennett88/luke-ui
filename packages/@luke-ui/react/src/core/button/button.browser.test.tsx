import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
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

test('blocks a second Action start while one is pending', async () => {
	let starts = 0;
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});

	const { locator, user } = render(
		<Button
			pressAction={async () => {
				starts += 1;
				await gate;
			}}
		>
			Save
		</Button>,
	);
	const button = locator.getByRole('button', { name: 'Save' });

	await user.click(button);
	expect(button.element().getAttribute('data-pending')).toBe('true');
	expect(button.element().getAttribute('aria-disabled')).toBe('true');
	// RAC blocks pointer interaction while pending; do not use user.click (it waits for enabled).
	button.element().dispatchEvent(
		new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
	);
	expect(starts).toBe(1);

	release();
	await expect.poll(() => button.element().getAttribute('data-pending')).toBeNull();
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
	const button = locator.getByRole('button', { name: 'Save' });

	expect(button.element().getAttribute('data-pending')).toBe('true');
	expect(button.element().getAttribute('aria-disabled')).toBe('true');
	// External pending disables the RAC button before press handlers run.
	button.element().dispatchEvent(
		new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
	);
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
	const { locator, user } = render(
		<TestErrorBoundary>
			<Button
				pressAction={async () => {
					throw new Error('save failed');
				}}
			>
				Save
			</Button>
		</TestErrorBoundary>,
	);

	await user.click(locator.getByRole('button', { name: 'Save' }));
	await expect.element(locator.getByRole('alert')).toHaveTextContent('save failed');
});

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

interface TestErrorBoundaryProps {
	children: ReactNode;
}

interface TestErrorBoundaryState {
	error: Error | null;
}

class TestErrorBoundary extends Component<TestErrorBoundaryProps, TestErrorBoundaryState> {
	override state: TestErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): TestErrorBoundaryState {
		return { error };
	}

	override componentDidCatch(error: Error, info: ErrorInfo) {
		void error;
		void info;
	}

	override render() {
		if (this.state.error) {
			return <div role="alert">{this.state.error.message}</div>;
		}
		return this.props.children;
	}
}
