import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
	email: z.email('Enter a valid email address.'),
	name: z.string().min(1, 'Enter your name.'),
});

export default () => {
	const form = useForm({
		defaultValues: { email: '', name: '' },
		resolver: zodResolver(schema),
	});

	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<Form
				necessityIndicator="required-label"
				onSubmit={form.handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<Stack gap="sp16">
					<Controller
						control={form.control}
						name="name"
						render={({ field, fieldState }) => {
							return (
								<TextInputField
									errorMessage={fieldState.error?.message}
									inputRef={field.ref}
									isRequired
									label="Name"
									name={field.name}
									onBlur={field.onBlur}
									onChange={field.onChange}
									value={field.value}
								/>
							);
						}}
					/>
					<Controller
						control={form.control}
						name="email"
						render={({ field, fieldState }) => {
							return (
								<TextInputField
									errorMessage={fieldState.error?.message}
									inputRef={field.ref}
									isRequired
									label="Email address"
									name={field.name}
									onBlur={field.onBlur}
									onChange={field.onChange}
									type="email"
									value={field.value}
								/>
							);
						}}
					/>
					<Cluster>
						<Button type="submit">Create account</Button>
					</Cluster>
				</Stack>
			</Form>
			<Text elementType="p" isVisuallyHidden={!form.formState.isSubmitSuccessful} role="status">
				{form.formState.isSubmitSuccessful
					? `Account created for ${form.getValues('name')}.`
					: null}
			</Text>
		</Stack>
	);
};
