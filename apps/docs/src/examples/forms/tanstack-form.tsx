import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useRef } from 'react';
import * as z from 'zod';

const schema = z.object({
	email: z.email('Enter an email address in the form you@example.com.'),
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
		<Stack gap="sp16" maxInlineSize="20rem">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				ref={formRef}
			>
				<Stack gap="sp16">
					<form.Field name="name">
						{(field) => (
							<Stack minBlockSize="5.5rem">
								<TextField
									errorMessage={field.state.meta.errors[0]?.message}
									label="Name"
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									validationBehavior="aria"
									value={field.state.value}
								/>
							</Stack>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<Stack minBlockSize="5.5rem">
								<TextField
									errorMessage={field.state.meta.errors[0]?.message}
									label="Email"
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									validationBehavior="aria"
									value={field.state.value}
								/>
							</Stack>
						)}
					</form.Field>
					<Cluster>
						<Button type="submit">Create account</Button>
					</Cluster>
				</Stack>
			</form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					<form.Subscribe selector={(state) => (state.isSubmitSuccessful ? state.values.name : '')}>
						{(submittedName) => (submittedName ? `Submitted: ${submittedName}` : '\u00a0')}
					</form.Subscribe>
				</Text>
			</Stack>
		</Stack>
	);
};
