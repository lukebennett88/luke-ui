import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

/** Account danger zone: confirm deletion with typed name. */
export function AccountPage() {
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState<string | undefined>();
	const expected = 'delete my account';

	return (
		<Stack gap="sp24">
			<Stack gap="sp8">
				<Heading level={1}>Account</Heading>
				<Text color="secondary">
					Dangerous account actions. Validation stays application-owned.
				</Text>
			</Stack>
			<Box
				backgroundColor="surface.floating"
				borderRadius="surface"
				borderStyle="solid"
				borderWidth="thin"
				padding="sp16"
				style={{ borderColor: vars.color.border.danger }}
			>
				<Stack gap="sp16">
					<Heading level={2}>Delete account</Heading>
					<Text>
						This cannot be undone. Type <Text elementType="strong">{expected}</Text> to confirm.
					</Text>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							if (confirm.trim().toLowerCase() !== expected) {
								setError(`Type “${expected}” exactly to continue.`);
								return;
							}
							setError(undefined);
							setConfirm('');
						}}
					>
						<Stack gap="sp16">
							<TextField
								errorMessage={error}
								label="Confirmation"
								name="confirmDelete"
								onChange={(value) => {
									setConfirm(value);
									if (error) setError(undefined);
								}}
								value={confirm}
							/>
							<Button prominence="high" tone="critical" type="submit">
								Delete account
							</Button>
						</Stack>
					</form>
				</Stack>
			</Box>
		</Stack>
	);
}
