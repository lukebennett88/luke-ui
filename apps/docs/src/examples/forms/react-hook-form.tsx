import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type FormValues = {
	name: string;
	terms: boolean;
};

export default () => {
	const [submittedName, setSubmittedName] = useState('');
	const { control, handleSubmit, reset } = useForm<FormValues>({
		defaultValues: { name: '', terms: false },
	});

	function onSubmit(values: FormValues) {
		setSubmittedName(values.name);
	}

	function handleReset() {
		setSubmittedName('');
		reset();
	}

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<form onReset={handleReset} onSubmit={handleSubmit(onSubmit)}>
				<Box display="flex" flexDirection="column" gap="400">
					<Controller
						control={control}
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
						rules={{ required: 'Enter your name.' }}
					/>
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
					<Box display="flex" gap="200">
						<Button type="submit">Create account</Button>
						<Button appearance="subtle" type="reset">
							Reset
						</Button>
					</Box>
				</Box>
			</form>
			{submittedName ? <Text elementType="p">Submitted: {submittedName}</Text> : null}
		</Box>
	);
};
