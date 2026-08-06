import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useForm } from '@tanstack/react-form';
import { useRef } from 'react';
import * as z from 'zod';

const schema = z.object({
	email: z.email('Enter an email address in the form you@example.com.'),
	name: z.string().min(1, 'Enter your name.'),
});

export default () => {
	const nameRef = useRef<HTMLInputElement>(null);
	const emailRef = useRef<HTMLInputElement>(null);

	const form = useForm({
		defaultValues: { email: '', name: '' },
		onSubmit: () => undefined,
		onSubmitInvalid: ({ formApi }) => {
			const firstInvalid = formApi.getFieldMeta('name')?.errors.length ? nameRef : emailRef;
			firstInvalid.current?.focus();
		},
		validators: { onChange: schema },
	});

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
			>
				<Box display="flex" flexDirection="column" gap="400">
					<form.Field name="name">
						{(field) => (
							<TextField
								errorMessage={field.state.meta.errors[0]?.message}
								inputRef={nameRef}
								isInvalid={!field.state.meta.isValid}
								label="Name"
								onBlur={field.handleBlur}
								onChange={field.handleChange}
								validationBehavior="aria"
								value={field.state.value}
							/>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<TextField
								errorMessage={field.state.meta.errors[0]?.message}
								inputRef={emailRef}
								isInvalid={!field.state.meta.isValid}
								label="Email"
								onBlur={field.handleBlur}
								onChange={field.handleChange}
								validationBehavior="aria"
								value={field.state.value}
							/>
						)}
					</form.Field>
					<Box>
						<Button type="submit">Create account</Button>
					</Box>
				</Box>
			</form>
			<Text elementType="p" role="status">
				<form.Subscribe selector={(state) => (state.isSubmitSuccessful ? state.values.name : '')}>
					{(submittedName) => (submittedName ? `Submitted: ${submittedName}` : null)}
				</form.Subscribe>
			</Text>
		</Box>
	);
};
