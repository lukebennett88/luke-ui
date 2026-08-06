import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type FormValues = {
	terms: boolean;
};

export default () => {
	const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: { terms: false },
	});

	function onSubmit() {
		setHasAcceptedTerms(true);
	}

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<form onSubmit={handleSubmit(onSubmit)}>
				<Box display="flex" flexDirection="column" gap="400">
					<Controller
						control={control}
						name="terms"
						render={({ field, fieldState }) => (
							<Checkbox
								errorMessage={fieldState.error?.message}
								inputRef={field.ref}
								isInvalid={fieldState.invalid}
								isSelected={field.value}
								onBlur={field.onBlur}
								onChange={field.onChange}
								validationBehavior="aria"
							>
								I accept the terms of service
							</Checkbox>
						)}
						rules={{ required: 'Accept the terms of service before you continue.' }}
					/>
					<Box>
						<Button type="submit">Continue</Button>
					</Box>
				</Box>
			</form>
			<Text elementType="p" role="status">
				{hasAcceptedTerms ? 'Terms accepted.' : null}
			</Text>
		</Box>
	);
};
