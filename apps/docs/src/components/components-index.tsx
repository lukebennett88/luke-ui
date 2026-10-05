import { Box } from '@luke-ui/react/box';
import { Grid } from '@luke-ui/react/grid';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { JSX } from 'react';
import type {
	ComponentIndexEntry,
	ComponentIndexGroup,
} from '../generated/components-index.generated.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';

/**
 * Purpose-grouped index of every component guide, generated from the guides themselves. The
 * components landing page renders from this component so the documented set never drifts.
 */
export function ComponentsIndex(): JSX.Element {
	return (
		<HeadingLevels base={2}>
			<Stack className="not-prose" gap="sp64" marginBlockStart="sp40">
				{componentIndexGroups.map((group, index) => (
					<CategoryGroup group={group} isFirst={index === 0} key={group.title} />
				))}
			</Stack>
		</HeadingLevels>
	);
}

const groupStyle = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
	paddingBlockStart: vars.space.sp40,
} as const;

function CategoryGroup({ group, isFirst }: { group: ComponentIndexGroup; isFirst: boolean }) {
	return (
		<Stack elementType="section" gap="sp24" style={isFirst ? undefined : groupStyle}>
			<Heading typography="heading4">{group.title}</Heading>
			<Grid
				columns={{
					initial: 1,
					bp768: 2,
					bp1024: 3,
				}}
				gap="sp24"
			>
				{group.entries.map((entry) => (
					<ComponentEntry entry={entry} key={entry.url} />
				))}
			</Grid>
		</Stack>
	);
}

function ComponentEntry({ entry }: { entry: ComponentIndexEntry }) {
	return (
		<Box
			backgroundColor="surface.canvas"
			blockSize="100%"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			className={cx(
				'no-underline transition-colors focus-visible:outline-2',
				'focus-visible:outline-(--luke-color-border-focus) focus-visible:outline-offset-2',
				'hover:bg-(--luke-color-background-neutral-subtle-hover)',
				'active:bg-(--luke-color-background-neutral-subtle-pressed)',
			)}
			padding="sp24"
			renderRoot={(props) => <Link {...props} href={entry.url} />}
		>
			<Stack gap="sp8">
				<Text elementType="span" fontWeight="emphasis">
					{entry.name}
				</Text>
				<Text color="secondary" elementType="span" typography="caption">
					{entry.description}
				</Text>
			</Stack>
		</Box>
	);
}
