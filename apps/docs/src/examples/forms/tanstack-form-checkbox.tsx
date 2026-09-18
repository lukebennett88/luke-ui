import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
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
		<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				ref={formRef}
			>
				<Stack gap="sp16">
					<form.Field name="terms">
						{(field) => (
							<Stack minBlockSize="4.5rem">
								<Checkbox
									errorMessage={field.state.meta.errors[0]?.message}
									isSelected={field.state.value}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									validationBehavior="aria"
								>
									I accept the terms of service
								</Checkbox>
							</Stack>
						)}
					</form.Field>
					<Button type="submit">Continue</Button>
				</Stack>
			</form>
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
