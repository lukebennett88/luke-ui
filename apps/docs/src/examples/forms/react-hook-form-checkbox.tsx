import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
	terms: z.boolean().refine((accepted) => accepted, {
		error: 'Accept the terms before you continue.',
	}),
});

export default () => {
	const form = useForm({
		defaultValues: { terms: false },
		resolver: zodResolver(schema),
	});

	return (
		<Stack gap="space.16" maxInlineSize="20rem">
			<Form
				necessityIndicator="required-label"
				onSubmit={form.handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<Stack gap="space.16">
					<Controller
						control={form.control}
						name="terms"
						render={({ field, fieldState }) => {
							return (
								<CheckboxField
									errorMessage={fieldState.error?.message}
									inputRef={field.ref}
									isRequired
									isSelected={field.value}
									label="I accept the terms of service"
									name={field.name}
									onBlur={field.onBlur}
									onChange={field.onChange}
								/>
							);
						}}
					/>
					<Cluster>
						<Button type="submit">Continue</Button>
					</Cluster>
				</Stack>
			</Form>
			<Text elementType="p" isVisuallyHidden={!form.formState.isSubmitSuccessful} role="status">
				{form.formState.isSubmitSuccessful ? 'Terms accepted.' : null}
			</Text>
		</Stack>
	);
};
