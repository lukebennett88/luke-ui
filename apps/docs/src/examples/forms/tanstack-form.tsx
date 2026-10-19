import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useRef } from 'react';
import * as z from 'zod';

const schema = z.object({
	email: z.email('Enter a valid email address.'),
	name: z.string().min(1, 'Enter your name.'),
});

const FOCUSABLE_SELECTOR =
	'input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

function focusFirstInvalidField(form: HTMLFormElement | null) {
	const invalid = form?.querySelector('[aria-invalid="true"]');
	if (!invalid) return;
	const control = invalid.matches(FOCUSABLE_SELECTOR)
		? invalid
		: invalid.querySelector(FOCUSABLE_SELECTOR);
	if (control instanceof HTMLElement) control.focus();
}

export default () => {
	const formRef = useRef<HTMLFormElement>(null);

	const form = useForm({
		defaultValues: { email: '', name: '' },
		onSubmit: () => undefined,
		onSubmitInvalid: () => focusFirstInvalidField(formRef.current),
		validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
		validators: { onDynamic: schema, onSubmit: schema },
	});

	return (
		<Stack gap="space.16" maxInlineSize="20rem">
			<Form
				necessityIndicator="required-label"
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				ref={formRef}
				validationBehavior="aria"
			>
				<Stack gap="space.16">
					<form.Field name="name">
						{(field) => {
							return (
								<TextInputField
									errorMessage={field.state.meta.errors[0]?.message}
									isRequired
									label="Name"
									name={field.name}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									value={field.state.value}
								/>
							);
						}}
					</form.Field>
					<form.Field name="email">
						{(field) => {
							return (
								<TextInputField
									errorMessage={field.state.meta.errors[0]?.message}
									isRequired
									label="Email address"
									name={field.name}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									type="email"
									value={field.state.value}
								/>
							);
						}}
					</form.Field>
					<Cluster>
						<Button type="submit">Create account</Button>
					</Cluster>
				</Stack>
			</Form>
			<form.Subscribe selector={(state) => (state.isSubmitSuccessful ? state.values.name : '')}>
				{(submittedName) => (
					<Text elementType="p" isVisuallyHidden={!submittedName} role="status">
						{submittedName ? `Account created for ${submittedName}.` : null}
					</Text>
				)}
			</form.Subscribe>
		</Stack>
	);
};
