import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectForwardsDomProps, forwardedDomProps } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';

test('VisuallyHidden supplies an accessible label and defaults to span', async () => {
	const { locator, container } = render(
		<button type="button">
			<VisuallyHidden>Save changes</VisuallyHidden>
		</button>,
	);
	const label = locator.getByText('Save changes').element();

	expect(label.tagName).toBe('SPAN');
	await expect.element(locator.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
	await expectNoAxeViolations(container);
});

test('VisuallyHidden forwards DOM props and its ref', () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(
		<VisuallyHidden {...forwardedDomProps} ref={ref} title="Additional context">
			Hidden label
		</VisuallyHidden>,
	);
	const target = locator.getByText('Hidden label').element();

	expectForwardsDomProps(target, ref);
	expect(target).toHaveAttribute('title', 'Additional context');
});

test('VisuallyHidden keeps the requested heading semantics', () => {
	const { locator } = render(<VisuallyHidden elementType="h2">Hidden heading</VisuallyHidden>);
	const heading = locator.getByRole('heading', { level: 2, name: 'Hidden heading' }).element();

	expect(heading.tagName).toBe('H2');
});

test('VisuallyHidden isFocusable preserves keyboard focus navigation', async () => {
	const { locator, user } = render(
		<>
			<button type="button">Before</button>
			<VisuallyHidden isFocusable>
				<a href="#main">Skip to main content</a>
			</VisuallyHidden>
			<button type="button">After</button>
		</>,
	);
	const link = locator.getByRole('link', { name: 'Skip to main content' }).element();

	await user.tab();
	await user.tab();
	expect(link).toHaveFocus();

	await user.tab();
	expect(locator.getByRole('button', { name: 'After' }).element()).toHaveFocus();
});

test('VisuallyHidden keeps consumer style while focus visibility changes', async () => {
	const { locator, user } = render(
		<>
			<button type="button">Before</button>
			<VisuallyHidden isFocusable style={{ color: 'rgb(1, 2, 3)' }}>
				<a href="#main">Skip link</a>
			</VisuallyHidden>
			<button type="button">After</button>
		</>,
	);
	const link = locator.getByRole('link', { name: 'Skip link' }).element();
	const root = link.parentElement;
	if (!(root instanceof HTMLElement)) throw new Error('Expected VisuallyHidden root.');

	expect(root.style.color).toBe('rgb(1, 2, 3)');

	await user.tab();
	await user.tab();
	expect(link).toHaveFocus();
	expect(root.style.color).toBe('rgb(1, 2, 3)');

	await user.tab();
	expect(locator.getByRole('button', { name: 'After' }).element()).toHaveFocus();
	expect(root.style.color).toBe('rgb(1, 2, 3)');
});

test('VisuallyHidden renderRoot owns the root without an extra wrapper', () => {
	const calls: Array<Array<unknown>> = [];
	const ref = createRef<HTMLElement>();
	const { locator, container } = render(
		<VisuallyHidden
			className="consumer-class"
			isFocusable
			ref={ref}
			renderRoot={(...args) => {
				calls.push(args);
				const [domProps] = args;
				return (
					<a {...domProps} href="#main">
						Skip to main content
					</a>
				);
			}}
		/>,
	);
	const link = locator.getByRole('link', { name: 'Skip to main content' }).element();

	expect(container.firstElementChild).toBe(link);
	expect(link.tagName).toBe('A');
	expect(link).toHaveClass('consumer-class');
	expect(ref.current).toBe(link);
	expect(calls.length).toBeGreaterThan(0);
	for (const args of calls) {
		expect(args[1]).toEqual({});
		expect(args[0]).toEqual(
			expect.objectContaining({
				className: expect.stringContaining('consumer-class'),
				ref: expect.any(Function),
			}),
		);
	}
});

test('VisuallyHidden renderRoot preserves callback ref cleanup', () => {
	const elements: Array<HTMLElement | null> = [];
	let cleanups = 0;
	const { locator, unmount } = render(
		<VisuallyHidden
			ref={(element) => {
				elements.push(element);
				return () => {
					cleanups += 1;
				};
			}}
			renderRoot={({ children, ...domProps }) => (
				<a {...domProps} href="#main">
					{children}
				</a>
			)}
		>
			Skip
		</VisuallyHidden>,
	);

	expect(elements).toEqual([locator.getByRole('link', { name: 'Skip' }).element()]);
	unmount();
	expect(cleanups).toBe(1);
});

test('VisuallyHidden composes consumer focus handlers with internal focus-within handlers', async () => {
	const focusLog: Array<string> = [];
	const { locator, user } = render(
		<>
			<button type="button">Before</button>
			<VisuallyHidden
				isFocusable
				onBlur={() => {
					focusLog.push('blur');
				}}
				onFocus={() => {
					focusLog.push('focus');
				}}
			>
				<a href="#main">Skip link</a>
			</VisuallyHidden>
			<button type="button">After</button>
		</>,
	);
	const link = locator.getByRole('link', { name: 'Skip link' }).element();

	await user.tab();
	await user.tab();
	expect(link).toHaveFocus();
	expect(focusLog).toContain('focus');

	await user.tab();
	expect(locator.getByRole('button', { name: 'After' }).element()).toHaveFocus();
	expect(focusLog).toEqual(['focus', 'blur']);
});

test('VisuallyHidden keeps consumer className while focus visibility changes', async () => {
	const { locator, user } = render(
		<>
			<button type="button">Before</button>
			<VisuallyHidden className="consumer-class" isFocusable>
				<a href="#main">Skip link</a>
			</VisuallyHidden>
			<button type="button">After</button>
		</>,
	);
	const link = locator.getByRole('link', { name: 'Skip link' }).element();
	const root = link.parentElement;
	if (!(root instanceof HTMLElement)) throw new Error('Expected VisuallyHidden root.');

	expect(root).toHaveClass('consumer-class');

	await user.tab();
	await user.tab();
	expect(link).toHaveFocus();
	expect(root).toHaveClass('consumer-class');

	await user.tab();
	expect(locator.getByRole('button', { name: 'After' }).element()).toHaveFocus();
	expect(root).toHaveClass('consumer-class');
});

for (const appearance of visualAppearances) {
	test(
		`VisuallyHidden focus reveal: ${appearance.theme} ${appearance.mode}`,
		{ tags: ['visual'] },
		async () => {
			const focusLog: Array<string> = [];
			const { locator, user } = render(
				<Stack>
					<button type="button">Before</button>
					<VisuallyHidden>Static hidden content</VisuallyHidden>
					<VisuallyHidden
						isFocusable
						onBlur={() => {
							focusLog.push('blur');
						}}
						onFocus={() => {
							focusLog.push('focus');
						}}
					>
						<a href="#main">Skip to main content</a>
					</VisuallyHidden>
					<button type="button">After</button>
				</Stack>,
				{ appearance },
			);

			await captureVisualAppearance(locator, 'visually-hidden/hidden', appearance);

			await user.tab();
			await user.tab();
			await expect
				.element(locator.getByRole('link', { name: 'Skip to main content' }))
				.toHaveFocus();
			expect(focusLog).toEqual(['focus']);
			await captureVisualAppearance(locator, 'visually-hidden/focused', appearance);

			await user.tab();
			await expect.element(locator.getByRole('button', { name: 'After' })).toHaveFocus();
			expect(focusLog).toEqual(['focus', 'blur']);
			await captureVisualAppearance(locator, 'visually-hidden/blurred', appearance);
		},
	);
}
