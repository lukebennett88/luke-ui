import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type FormValues = {
	name: string;
	email: string;
};

export default () => {
	const [submittedName, setSubmittedName] = useState('');
	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: { name: '', email: '' },
	});

	function onSubmit(values: FormValues) {
		setSubmittedName(values.name);
	}

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<form onSubmit={handleSubmit(onSubmit)}>
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
						rules={{ required: 'Enter your email address.' }}
					/>
					<Box>
						<Button type="submit">Create account</Button>
					</Box>
				</Box>
			</form>
			<Text elementType="p" role="status">
				{submittedName ? `Submitted: ${submittedName}` : null}
			</Text>
		</Box>
	);
};
