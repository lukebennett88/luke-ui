import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
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
		<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
			<form onSubmit={form.handleSubmit(() => undefined)}>
				<Stack gap="sp16">
					<Controller
						control={form.control}
						name="name"
						render={({ field, fieldState }) => (
							<Stack minBlockSize="5.5rem">
								<TextField
									errorMessage={fieldState.error?.message}
									inputRef={field.ref}
									label="Name"
									onBlur={field.onBlur}
									onChange={field.onChange}
									validationBehavior="aria"
									value={field.value}
								/>
							</Stack>
						)}
					/>
					<Controller
						control={form.control}
						name="email"
						render={({ field, fieldState }) => (
							<Stack minBlockSize="5.5rem">
								<TextField
									errorMessage={fieldState.error?.message}
									inputRef={field.ref}
									label="Email"
									onBlur={field.onBlur}
									onChange={field.onChange}
									validationBehavior="aria"
									value={field.value}
								/>
							</Stack>
						)}
					/>
					<Cluster>
						<Button type="submit">Create account</Button>
					</Cluster>
				</Stack>
			</form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					{form.formState.isSubmitSuccessful ? `Submitted: ${form.getValues('name')}` : '\u00a0'}
				</Text>
			</Stack>
		</Stack>
	);
};
