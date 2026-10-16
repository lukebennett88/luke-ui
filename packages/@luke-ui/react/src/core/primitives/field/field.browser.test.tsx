import { FieldError, FieldLabel } from '@luke-ui/react/primitives/field';
import { TextInput, TextInputRoot } from '@luke-ui/react/primitives/text-input';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { render } from '../../test-utils/render.js';

test('FieldError keeps React Aria render props, ref, and render composition around its icon', async () => {
	const ref = createRef<HTMLDivElement>();
	const { container } = render(
		<TextInputRoot isInvalid>
			<FieldLabel>Email</FieldLabel>
			<TextInput />
			<FieldError
				className={({ isInvalid }) => (isInvalid ? 'custom-error' : '')}
				ref={ref}
				render={(domProps, { isInvalid }) => {
					return <div {...domProps} data-invalid={isInvalid} />;
				}}
				style={({ isInvalid }) => ({ paddingInlineStart: isInvalid ? '3px' : '0' })}
			>
				{({ isInvalid }) =>
					isInvalid ? (
						<>
							Read the <a href="#terms">terms</a> first.
						</>
					) : null
				}
			</FieldError>
		</TextInputRoot>,
	);

	const error = ref.current;
	if (error == null) throw new Error('Expected the ref to hold the error element.');
	expect(error).toHaveClass('custom-error');
	expect(error).toHaveAttribute('data-invalid', 'true');
	expect(error).toHaveStyle({ paddingInlineStart: '3px' });
	expect(error.querySelector('[aria-hidden="true"]')).not.toBeNull();
	expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
		'Read the terms first.',
	);
	expect(error).toContainElement(page.getByRole('link', { name: 'terms' }).element());
	await expectNoAxeViolations(container);
});

test('FieldError shows the validation message when it has no children', () => {
	render(
		<TextInputRoot validate={() => 'Enter a value.'} validationBehavior="aria">
			<FieldLabel>Email</FieldLabel>
			<TextInput />
			<FieldError />
		</TextInputRoot>,
	);

	const message = page.getByText('Enter a value.').element();
	expect(message.closest('[id]')?.querySelector('[aria-hidden="true"]')).not.toBeNull();
	expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
		'Enter a value.',
	);
});

test('FieldError holds block content', () => {
	const ref = createRef<HTMLDivElement>();
	render(
		<TextInputRoot isInvalid>
			<FieldLabel>Email</FieldLabel>
			<TextInput />
			<FieldError ref={ref}>
				<ul>
					<li>Enter an email address.</li>
				</ul>
			</FieldError>
		</TextInputRoot>,
	);

	const list = page.getByRole('list').element();
	expect(ref.current).toContainElement(list);
	for (
		let node = list.parentElement;
		node != null && node !== ref.current;
		node = node.parentElement
	) {
		expect(node.tagName).toBe('DIV');
	}
	expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
		'Enter an email address.',
	);
});
