import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Grid } from '@luke-ui/react/grid';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { SubmitEvent } from 'react';
import { useTransition } from 'react';
import { CodeBlock } from './code-block/code-block.js';
import { DocsLink } from './docs-link.js';
import { ThemeControls } from './theme-controls.js';

const INSTALL_COMMAND = 'pnpm add @luke-ui/react react-aria-components';

/**
 * Split hero: install copy, CTAs, and the copyable install command on the left, a themed panel on
 * the right pairing `ThemeControls` with a small form that demonstrates browser validation and a
 * pending Button.
 */
export function HomeHero() {
	const [isPending, startTransition] = useTransition();

	// `onSubmit` rather than a form Action, so React never resets the field after saving.
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		startTransition(async () => {
			await delay(1000);
		});
	}

	return (
		<Grid
			columns={{
				initial: 1,
				bp768: 2,
			}}
			elementType="section"
			gap={{
				initial: 'sp40',
				bp768: 'sp64',
			}}
			paddingBlock={{
				initial: 'sp64',
				bp768: 'sp96',
			}}
			style={{
				alignItems: 'center',
			}}
		>
			<Stack gap="sp24">
				<Heading typography="display">Luke UI</Heading>
				<Text color="secondary" elementType="p" typography="lead">
					Luke UI is a React design system built on React Aria Components.
				</Text>
				<Cluster gap="sp12">
					<DocsLink
						appearance="button"
						params={{
							_splat: 'docs/installation',
						}}
						prominence="high"
						to="/$"
					>
						Installation
					</DocsLink>
					<DocsLink
						appearance="button"
						params={{
							_splat: 'components',
						}}
						prominence="low"
						to="/$"
					>
						Components
					</DocsLink>
				</Cluster>
				<Box
					maxInlineSize={{
						initial: '100%',
						bp768: '28rem',
					}}
				>
					<CodeBlock code={INSTALL_COMMAND} title="Terminal" />
				</Box>
			</Stack>
			<Box
				backgroundColor="surface.floating"
				borderColor="decorative"
				borderRadius="surface"
				borderStyle="solid"
				borderWidth="thin"
				boxShadow="floating"
				display="grid"
				gap="sp16"
				padding="sp24"
			>
				<ThemeControls className="justify-self-start" />
				<form onSubmit={handleSubmit}>
					<Stack gap="sp16">
						<TextInputField isRequired label="Name" name="name" />
						<Cluster gap="sp8">
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
		</Grid>
	);
}

/** Stands in for a real submission's latency. */
async function delay(ms: number) {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
