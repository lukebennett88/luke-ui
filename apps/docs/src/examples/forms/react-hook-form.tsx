import { zodResolver } from '@hookform/resolvers/zod';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
	email: z.email('Enter an email address in the form you@example.com.'),
	name: z.string().min(1, 'Enter your name.'),
});

export default () => {
	const form = useForm({
		defaultValues: { email: '', name: '' },
		resolver: zodResolver(schema),
	});

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<form onSubmit={form.handleSubmit(() => undefined)}>
				<Box display="flex" flexDirection="column" gap="400">
					<Controller
						control={form.control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField
								errorMessage={fieldState.error?.message}
								inputRef={field.ref}
								isInvalid={fieldState.invalid}
								label="Name"
								onBlur={field.onBlur}
								onChange={field.onChange}
								validationBehavior="aria"
								value={field.value}
							/>
						)}
					/>
					<Controller
						control={form.control}
						name="email"
						render={({ field, fieldState }) => (
							<TextField
								errorMessage={fieldState.error?.message}
								inputRef={field.ref}
								isInvalid={fieldState.invalid}
								label="Email"
								onBlur={field.onBlur}
								onChange={field.onChange}
								validationBehavior="aria"
								value={field.value}
							/>
						)}
					/>
					<Box>
						<Button type="submit">Create account</Button>
					</Box>
				</Box>
			</form>
			<Text elementType="p" role="status">
				{form.formState.isSubmitSuccessful ? `Submitted: ${form.getValues('name')}` : null}
			</Text>
		</Box>
	);
};
