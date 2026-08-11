import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { HeadingLevels } from '@luke-ui/react/heading-context';
import { Card, Cards } from 'fumadocs-ui/components/card';
import type { JSX } from 'react';
import type { ComponentIndexGroup } from '../generated/components-index.generated.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';

/**
 * Purpose-grouped index of every component guide, generated from the guides themselves. The
 * components landing page renders from this component so the documented set never drifts.
 */
export function ComponentsIndex(): JSX.Element {
	return (
		<HeadingLevels base={1}>
			<Box
				className="not-prose"
				display="flex"
				flexDirection="column"
				gap="800"
				marginBlockStart="800"
			>
				{componentIndexGroups.map((group) => (
					<CategoryGroup group={group} key={group.title} />
				))}
			</Box>
		</HeadingLevels>
	);
}

function CategoryGroup({ group }: { group: ComponentIndexGroup }) {
	return (
		<Box
			display="flex"
			elementType="section"
			flexDirection="column"
			gap="400"
			marginBlockStart="400"
		>
			<Heading size="500">{group.title}</Heading>
			<Cards>
				{group.entries.map((entry) => (
					<Card href={entry.url} key={entry.url} title={entry.name}>
						{entry.description}
					</Card>
				))}
			</Cards>
		</Box>
	);
}
