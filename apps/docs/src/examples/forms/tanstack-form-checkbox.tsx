import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useRef } from 'react';
import * as z from 'zod';

const schema = z.object({
	terms: z.boolean().refine((accepted) => accepted, {
		error: 'Accept the terms of service before you continue.',
	}),
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
		defaultValues: { terms: false },
		onSubmit: () => undefined,
		onSubmitInvalid: () => focusFirstInvalidField(formRef.current),
		validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
		validators: { onDynamic: schema, onSubmit: schema },
	});

	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<Form
				necessityIndicator="required-label"
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				ref={formRef}
				validationBehavior="aria"
			>
				<Stack gap="sp16">
					<form.Field name="terms">
						{(field) => {
							return (
								<CheckboxField
									errorMessage={field.state.meta.errors[0]?.message}
									isRequired
									isSelected={field.state.value}
									label="I accept the terms of service"
									name={field.name}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
								/>
							);
						}}
					</form.Field>
					<Cluster>
						<Button type="submit">Continue</Button>
					</Cluster>
				</Stack>
			</Form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					<form.Subscribe selector={(state) => state.isSubmitSuccessful}>
						{(isSubmitSuccessful) => (isSubmitSuccessful ? 'Terms accepted.' : '\u00a0')}
					</form.Subscribe>
				</Text>
			</Stack>
		</Stack>
	);
};
