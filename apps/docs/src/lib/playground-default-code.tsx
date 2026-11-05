import { zodResolver } from '@hookform/resolvers/zod';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const DIGIT_PATTERN = /\d/;

const schema = z.object({
	email: z.email('Enter a valid email address.'),
	password: z
		.string()
		.min(1, 'Enter a password.')
		.refine((value) => value.length >= 8 && DIGIT_PATTERN.test(value), {
			message: 'Use at least 8 characters, including a number.',
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
			backgroundColor="surface.subdued"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			boxShadow="raised"
			marginInline="auto"
			maxInlineSize="26rem"
			// Utility props take an object keyed by breakpoint. Breakpoints are
			// container queries resolved against the theme root, so this follows the
			// preview's inline size.
			paddingBlock={{
				initial: 'space.32',
				bp768: 'space.64',
			}}
			paddingInline={{
				initial: 'space.24',
				bp768: 'space.48',
			}}
			renderRoot={(domProps) => <form {...domProps} onSubmit={handleSubmit} />}
		>
			<Stack gap="space.24">
				<Heading level={2}>Sign in</Heading>
				<Stack gap="space.16">
					<Controller
						control={form.control}
						name="email"
						render={({ field, fieldState }) => (
							<TextInputField
								autoComplete="email"
								errorMessage={fieldState.error?.message}
								inputRef={field.ref}
								isRequired
								label="Email address"
								name="email"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="you@example.com"
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
							<TextInputField
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
				</Stack>
				<Cluster gap="space.12" justifyContent="flex-end">
					<Button type="button">Create an account</Button>
					<Button prominence="high" type="submit">
						Sign in
					</Button>
				</Cluster>
				{signedInAs ? (
					<Box backgroundColor="success.subtle" borderRadius="control" padding="space.12">
						<Text elementType="p">Signed in as {signedInAs}</Text>
					</Box>
				) : null}
			</Stack>
		</Box>
	);
};
