import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Kbd } from '@luke-ui/react/kbd';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { SubmitEvent } from 'react';
import { useSyncExternalStore, useTransition } from 'react';
import { getIsMacKeyboardPlatformSnapshot } from './search.js';
import { ThemeControls } from './theme-controls.js';

/** A themed form demonstrating browser validation and a pending Button. */
export function HomeShowcase() {
	const [isPending, startTransition] = useTransition();

	// `onSubmit` rather than a form Action, so React never resets the field after saving.
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			await delay(1000);
		});
	}

	return (
		<Box
			aria-label="Interactive example"
			backgroundColor="surface.subdued"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			boxShadow="floating"
			display="grid"
			elementType="section"
			gap="space.16"
			padding="space.24"
		>
			<Box justifySelf="start">
				<ThemeControls />
			</Box>
			<form onSubmit={handleSubmit}>
				<Stack gap="space.16">
					<TextInputField isRequired label="Name" name="name" />
					<Cluster gap="space.8">
						<Button isPending={isPending} prominence="high" type="submit">
							Save changes
						</Button>
						<Button prominence="low" type="reset">
							Cancel
						</Button>
					</Cluster>
				</Stack>
			</form>
		</Box>
	);
}

/**
 * The search shortcut, with the modifier the search trigger shows. The platform is unknown until
 * hydration, so the line stays hidden until then rather than swapping its modifier in view.
 */
export function SearchShortcut() {
	const modifier = useSyncExternalStore(
		subscribeToNothing,
		getShortcutModifierSnapshot,
		getServerShortcutModifierSnapshot,
	);

	return (
		<Text
			color="secondary"
			elementType="p"
			style={modifier ? undefined : { visibility: 'hidden' }}
			typography="label"
		>
			Press <Kbd>{modifier ?? '⌘'}</Kbd> <Kbd>K</Kbd> to search the docs.
		</Text>
	);
}

/** Stands in for a real submission's latency. */
async function delay(ms: number) {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function subscribeToNothing() {
	return () => {};
}

function getShortcutModifierSnapshot() {
	return getIsMacKeyboardPlatformSnapshot() ? '⌘' : 'Ctrl';
}

function getServerShortcutModifierSnapshot() {
	return null;
}
