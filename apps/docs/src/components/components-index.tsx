import { Grid } from '@luke-ui/react/grid';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties, JSX } from 'react';
import type { ComponentIndexGroup } from '../generated/components-index.generated.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';
import { DocsCard } from './docs-card.js';

const subsequentGroupStyle = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
} as const satisfies CSSProperties;

/**
 * Purpose-grouped index of every component guide, generated from the guides themselves. The
 * components landing page renders from this component so the documented set never drifts.
 */
export function ComponentsIndex(): JSX.Element {
	return (
		<HeadingLevels base={2}>
			<Stack className="not-prose" gap="space.64" marginBlockStart="space.40">
				{componentIndexGroups.map((group, index) => (
					<CategoryGroup group={group} isFirst={index === 0} key={group.title} />
				))}
			</Stack>
		</HeadingLevels>
	);
}

function CategoryGroup({ group, isFirst }: { group: ComponentIndexGroup; isFirst: boolean }) {
	return (
		<Stack
			elementType="section"
			gap="space.32"
			paddingBlockStart={isFirst ? undefined : 'space.40'}
			style={isFirst ? undefined : subsequentGroupStyle}
		>
			<Heading typography="heading4">{group.title}</Heading>
			<HeadingLevels>
				<Grid
					columns={{
						initial: 1,
						bp768: 2,
						bp1024: 3,
					}}
					gap="space.12"
				>
					{group.entries.map((entry) => (
						<DocsCard
							description={entry.description}
							href={entry.url}
							key={entry.url}
							title={entry.name}
						/>
					))}
				</Grid>
			</HeadingLevels>
		</Stack>
	);
}
