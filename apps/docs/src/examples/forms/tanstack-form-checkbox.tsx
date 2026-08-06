import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';
import { useForm } from '@tanstack/react-form';
import { useRef } from 'react';
import * as z from 'zod';

const schema = z.object({
	terms: z.boolean().refine((accepted) => accepted, {
		error: 'Accept the terms of service before you continue.',
	}),
});

export default () => {
	const termsRef = useRef<HTMLInputElement>(null);

	const form = useForm({
		defaultValues: { terms: false },
		onSubmit: () => undefined,
		onSubmitInvalid: () => termsRef.current?.focus(),
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
					<form.Field name="terms">
						{(field) => (
							<Checkbox
								errorMessage={field.state.meta.errors[0]?.message}
								inputRef={termsRef}
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
