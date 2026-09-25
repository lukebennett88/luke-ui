import { Box } from '@luke-ui/react/box';
import { Grid } from '@luke-ui/react/grid';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { JSX } from 'react';
import type {
	ComponentIndexEntry,
	ComponentIndexGroup,
} from '../generated/components-index.generated.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';

/** Stable in-page anchor for a category section title. */
function categorySectionId(title: string): string {
	return title.toLowerCase().replaceAll(/\s+/g, '-');
}

/**
 * Purpose-grouped index of every component guide, generated from the guides themselves. The
 * components landing page renders from this component so the documented set never drifts.
 */
export function ComponentsIndex(): JSX.Element {
	return (
		<HeadingLevels base={2}>
			<Box
				className="not-prose"
				display="flex"
				flexDirection="column"
				gap="sp32"
				marginBlockStart="sp32"
			>
				{componentIndexGroups.map((group) => (
					<CategoryGroup group={group} key={group.title} />
				))}
			</Box>
		</HeadingLevels>
	);
}

const groupStyle = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
	paddingBlockStart: vars.space.sp16,
} as const;

const sectionStyle = {
	...groupStyle,
	// Sticky docs header can clip the group title when arriving via hash link.
	scrollMarginBlockStart: vars.space.sp64,
} as const;

function CategoryGroup({ group }: { group: ComponentIndexGroup }) {
	return (
		<Box
			display="flex"
			elementType="section"
			flexDirection="column"
			gap="sp16"
			id={categorySectionId(group.title)}
			style={sectionStyle}
		>
			<Heading typography="heading4">{group.title}</Heading>
			<Grid columns={{ bp768: 2, initial: 1 }} gap="sp16">
				{group.entries.map((entry) => (
					<ComponentEntry entry={entry} key={entry.url} />
				))}
			</Grid>
		</Box>
	);
}

function ComponentEntry({ entry }: { entry: ComponentIndexEntry }) {
	return (
		<Link className="components-index-entry" href={entry.url}>
			<Text elementType="span" fontWeight="emphasis">
				{entry.name}
			</Text>
			<Text color="secondary" elementType="span" typography="caption">
				{entry.description}
			</Text>
		</Link>
	);
}
