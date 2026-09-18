import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
	terms: z.boolean().refine((accepted) => accepted, {
		error: 'Accept the terms of service before you continue.',
	}),
});

export default () => {
	const form = useForm({
		defaultValues: { terms: false },
		resolver: zodResolver(schema),
	});

	return (
		<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
			<form onSubmit={form.handleSubmit(() => undefined)}>
				<Stack gap="sp16">
					<Controller
						control={form.control}
						name="terms"
						render={({ field, fieldState }) => (
							<Stack minBlockSize="4.5rem">
								<Checkbox
									errorMessage={fieldState.error?.message}
									inputRef={field.ref}
									isSelected={field.value}
									onBlur={field.onBlur}
									onChange={field.onChange}
									validationBehavior="aria"
								>
									I accept the terms of service
								</Checkbox>
							</Stack>
						)}
					/>
					<Button type="submit">Continue</Button>
				</Stack>
			</form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					{form.formState.isSubmitSuccessful ? 'Terms accepted.' : '\u00a0'}
				</Text>
			</Stack>
		</Stack>
	);
};
