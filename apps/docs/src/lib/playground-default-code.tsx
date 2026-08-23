import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { TextField } from '@luke-ui/react/text-field';
import type { SubmitEvent } from 'react';

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

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
			marginInline="auto"
			maxInlineSize="26rem"
			// Utility props take an object keyed by breakpoint. Breakpoints are
			// container queries resolved against the theme root, so this follows the
			// preview width.
			paddingBlock={{ initial: '800', medium: '1600' }}
			paddingInline={{ initial: '600', medium: '1200' }}
			render={(props) => <form {...props} onSubmit={handleSubmit} />}
		>
			<Heading level={2}>Sign in</Heading>
			<Box display="flex" flexDirection="column" gap="400">
				<TextField
					autoComplete="email"
					isRequired
					label="Email"
					name="email"
					placeholder="Enter your email address"
					type="email"
				/>
				<TextField
					autoComplete="current-password"
					description="At least 8 characters, including a number."
					isRequired
					label="Password"
					minLength={8}
					name="password"
					type="password"
					validate={
						// `validate` is for a rule the browser cannot check on its own. The constraint
						// props below (`isRequired`, `type="email"`, `minLength`) already generate their
						// own messages, so they need no `validate`.
						(value) => {
							if (!/\d/.test(value)) {
								return 'Passwords need at least one number.';
							}
						}
					}
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
		</Box>
	);
};
