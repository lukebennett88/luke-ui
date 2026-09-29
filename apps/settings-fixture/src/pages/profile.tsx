import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';

/** Public profile settings: name, bio, and save. */
export function ProfilePage() {
	const [name, setName] = useState('Ada Lovelace');
	const [bio, setBio] = useState('Mathematician and writer.');
	const [saved, setSaved] = useState(false);

	return (
		<Stack gap="sp24">
			<Stack gap="sp8">
				<Heading level={1}>Public profile</Heading>
				<Text color="secondary">
					How this account appears in public contexts. Built with Luke UI fields and actions.
				</Text>
			</Stack>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					setSaved(true);
				}}
			>
				<Stack gap="sp16">
					<TextField label="Display name" name="displayName" onChange={setName} value={name} />
					<TextField
						description="A short public summary."
						label="Bio"
						name="bio"
						onChange={setBio}
						value={bio}
					/>
					<Button prominence="high" type="submit">
						Save profile
					</Button>
					{saved ? (
						<Text color="success" role="status">
							Profile saved.
						</Text>
					) : null}
				</Stack>
			</form>
		</Stack>
	);
}
