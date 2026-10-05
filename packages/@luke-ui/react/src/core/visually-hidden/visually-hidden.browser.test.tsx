import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { createRef } from 'react';
import { TextContext } from 'react-aria-components/Text';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectForwardsDomProps, forwardedDomProps } from '../test-utils/forwarding.js';
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

test('VisuallyHidden does not require a slot inside a slotted text context', () => {
	const { locator } = render(
		<TextContext.Provider value={slottedTextContext}>
			<VisuallyHidden>Hidden label</VisuallyHidden>
		</TextContext.Provider>,
	);

	expect(locator.getByText('Hidden label').element().textContent).toBe('Hidden label');
});

const slottedTextContext = { slots: { description: {}, errorMessage: {} } };
