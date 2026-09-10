import { Button } from '@luke-ui/react/primitives/button';

export function SaveShortcutButton() {
	return (
		<Button prominence="high">
			<span>Save changes</span>
			<span aria-hidden>⌘S</span>
		</Button>
	);
}
