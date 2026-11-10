import { Button } from '#ui/button';
import { Text } from '#ui/text';

/** The smallest useful consumer: one heading and one action. */
export default function Minimal() {
	return (
		<main style={{ padding: 24 }}>
			<Text elementType="h1" typography="heading2">
				Minimal consumer
			</Text>
			<Button prominence="high">Save</Button>
		</main>
	);
}
