import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
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
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				ref={formRef}
			>
				<Box display="flex" flexDirection="column" gap="400">
					<form.Field name="terms">
						{(field) => (
							<Checkbox
								errorMessage={field.state.meta.errors[0]?.message}
								isInvalid={!field.state.meta.isValid}
								isSelected={field.state.value}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
								validationBehavior="aria"
							>
								I accept the terms of service
							</Checkbox>
						)}
					</form.Field>
					<Box>
						<Button type="submit">Continue</Button>
					</Box>
				</Box>
			</form>
			<Text elementType="p" role="status">
				<form.Subscribe selector={(state) => state.isSubmitSuccessful}>
					{(isSubmitSuccessful) => (isSubmitSuccessful ? 'Terms accepted.' : null)}
				</form.Subscribe>
			</Text>
		</Box>
	);
};
