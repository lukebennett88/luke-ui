import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { act, createRef } from 'react';
import { TextContext } from 'react-aria-components/Text';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import {
	expectForwardsDomProps,
	forwardedDomProps,
	expectHtmlElement,
} from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

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

test('VisuallyHidden forwards resolved props and its ref through render', () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(
		<VisuallyHidden
			{...forwardedDomProps}
			ref={ref}
			render={(resolvedProps) => <span {...resolvedProps} data-testid="custom-hidden" />}
		>
			Hidden label
		</VisuallyHidden>,
	);
	const target = locator.getByTestId('custom-hidden').element();

	expectForwardsDomProps(target, ref);
	expect(target.textContent).toBe('Hidden label');
	expect(getComputedStyle(target).position).toBe('absolute');
});

test('VisuallyHidden does not require a slot inside a slotted text context', () => {
	const { locator } = render(
		<TextContext.Provider value={slottedTextContext}>
			<VisuallyHidden>Hidden label</VisuallyHidden>
		</TextContext.Provider>,
	);

	expect(locator.getByText('Hidden label').element().textContent).toBe('Hidden label');
});

test('VisuallyHidden reveals focusable content while focus is within it', async () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(
		<>
			<VisuallyHidden isFocusable ref={ref} render={(props) => <span {...props} />}>
				<a href="#content">Skip to content</a>
			</VisuallyHidden>
			<button type="button">Continue</button>
		</>,
	);
	const link = locator.getByRole('link', { name: 'Skip to content' });
	const target = expectHtmlElement(link.element().parentElement, 'Expected the hidden wrapper.');

	expect(getComputedStyle(target).position).toBe('absolute');
	await act(() => userEvent.tab());
	await expect.element(link).toHaveFocus();
	expect(ref.current).toBe(target);
	expect(getComputedStyle(target).position).toBe('static');
	await act(() => userEvent.tab());
	await expect.element(locator.getByRole('button', { name: 'Continue' })).toHaveFocus();
	expect(getComputedStyle(target).position).toBe('absolute');
});

const slottedTextContext = { slots: { description: {}, errorMessage: {} } };
