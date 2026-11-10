// Same app as `minimal`, but imported through a barrel that also re-exports Box and ComboboxField.
import { Button, Text } from '#ui/index';

/** The smallest useful consumer: one heading and one action. */
export default function MinimalBarrel() {
	return (
		<main style={{ padding: 24 }}>
			<Text elementType="h1" typography="heading2">
				Minimal consumer
			</Text>
			<Button prominence="high">Save</Button>
		</main>
	);
}
