import { Button } from '@luke-ui/react/button/primitive';

export function SaveShortcutButton() {
	return (
		<Button appearance="solid" tone="accent">
			<span>Save changes</span>
			<span aria-hidden>⌘S</span>
		</Button>
	);
}
