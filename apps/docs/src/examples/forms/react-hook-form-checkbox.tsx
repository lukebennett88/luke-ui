import { zodResolver } from '@hookform/resolvers/zod';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
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
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<form onSubmit={form.handleSubmit(() => undefined)}>
				<Box display="flex" flexDirection="column" gap="sp16">
					<Controller
						control={form.control}
						name="terms"
						render={({ field, fieldState }) => (
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
						)}
					/>
					<Box>
						<Button type="submit">Continue</Button>
					</Box>
				</Box>
			</form>
			<Text elementType="p" role="status">
				{form.formState.isSubmitSuccessful ? 'Terms accepted.' : null}
			</Text>
		</Box>
	);
};
