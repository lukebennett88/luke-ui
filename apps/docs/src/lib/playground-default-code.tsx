import { zodResolver } from '@hookform/resolvers/zod';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const DIGIT_PATTERN = /\d/;

const schema = z.object({
	email: z.email('Enter an email address in the form you@example.com.'),
	password: z.string().refine((value) => value.length >= 8 && DIGIT_PATTERN.test(value), {
		message: 'At least 8 characters, including a number.',
	}),
});

export default () => {
	const form = useForm({
		defaultValues: { email: '', password: '' },
		resolver: zodResolver(schema),
	});

	const handleSubmit = form.handleSubmit((values) => {
		setSignedInAs(values.email);
	});

	// Set on a valid submit only, so the confirmation never tracks keystrokes.
	const [signedInAs, setSignedInAs] = useState<string | null>(null);

	return (
		<Box
			// These utility props turn a plain Box into a card. Background, border,
			// radius, and shadow all come from the theme scale.
			backgroundColor="surface.floating"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			boxShadow="raised"
			display="flex"
			flexDirection="column"
			gap="600"
			inlineSize="100%"
			marginInline="auto"
			maxInlineSize="26rem"
			// Utility props take an object keyed by breakpoint. Breakpoints are
			// container queries resolved against the theme root, so this follows the
			// preview width.
			paddingBlock={{ initial: '800', '768': '1600' }}
			paddingInline={{ initial: '600', '768': '1200' }}
			render={(props) => <form {...props} onSubmit={handleSubmit} />}
		>
			<Heading level={2}>Sign in</Heading>
			<Box display="flex" flexDirection="column" gap="400">
				<Controller
					control={form.control}
					name="email"
					render={({ field, fieldState }) => (
						<TextField
							autoComplete="email"
							errorMessage={fieldState.error?.message}
							inputRef={field.ref}
							isRequired
							label="Email"
							name="email"
							onBlur={field.onBlur}
							onChange={field.onChange}
							placeholder="Enter your email address"
							type="email"
							validationBehavior="aria"
							value={field.value}
						/>
					)}
				/>
				<Controller
					control={form.control}
					name="password"
					render={({ field, fieldState }) => (
						<TextField
							autoComplete="current-password"
							description="At least 8 characters, including a number."
							errorMessage={fieldState.error?.message}
							inputRef={field.ref}
							isRequired
							label="Password"
							minLength={8}
							name="password"
							onBlur={field.onBlur}
							onChange={field.onChange}
							type="password"
							validationBehavior="aria"
							value={field.value}
						/>
					)}
				/>
			</Box>
			<Box display="flex" gap="300" justifyContent="flex-end">
				<Button appearance="subtle" type="button">
					Create an account
				</Button>
				<Button tone="accent" type="submit">
					Sign in
				</Button>
			</Box>
			{signedInAs && (
				<Box backgroundColor="success.subtle.rest" borderRadius="control" padding="300">
					<Text elementType="p">Signed in as {signedInAs}</Text>
				</Box>
			)}
		</Box>
	);
};
