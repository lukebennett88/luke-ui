import { Code } from '@luke-ui/react/code';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';

interface FeatureCell {
	description: ReactNode;
	title: string;
}

const FEATURES: ReadonlyArray<FeatureCell> = [
	{
		description: (
			<>
				Luke UI includes two themes. To make your own, pass colour, typography, radius, and depth
				choices to <Code>defineTheme</Code>, or extend a bundled theme. Each generated theme has
				light and dark modes and passes contrast checks.
			</>
		),
		title: 'Themes',
	},
	{
		description:
			'Styles are static CSS with no runtime styling. You can apply a theme without a React provider.',
		title: 'Static CSS',
	},
	{
		description:
			'Use composed components, use the exported primitives when you need more control, or use React Aria Components directly.',
		title: 'Components and primitives',
	},
	{
		description:
			'Buttons with async actions manage their own pending state. Skeletons and spinners keep the size of the content they replace.',
		title: 'Loading states',
	},
	{
		description:
			'Validate with browser constraints, custom rules, or controlled and server errors, or hand validation to a form library.',
		title: 'Validation',
	},
	{
		description:
			'Text is trimmed to its visible bounds. Heading levels can follow component structure automatically.',
		title: 'Typography',
	},
];

const cellStyle = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
	paddingBlockStart: vars.space.sp16,
} as const;

/** Plain heading-and-paragraph grid introducing the six Luke UI features. */
export function HomeFeatures() {
	return (
		<section className="pt-16 pb-16 md:pt-24 md:pb-24">
			<HeadingLevels>
				<Heading>Features</Heading>
				<HeadingLevels>
					<div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-10 md:mt-10 md:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((feature) => (
							<div className="flex flex-col gap-3" key={feature.title} style={cellStyle}>
								<Heading>{feature.title}</Heading>
								<Text color="secondary">{feature.description}</Text>
							</div>
						))}
					</div>
				</HeadingLevels>
			</HeadingLevels>
		</section>
	);
}
