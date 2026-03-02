import type { DistributiveOmit } from '../../../types.js';
import type { TextProps } from '../primitives/text.js';
import { Text } from '../primitives/text.js';
import type { HeadingLevel } from './heading-context.js';
import { HeadingLevels, HeadingPresenceProvider } from './heading-context.js';

export type { HeadingLevel } from './heading-context.js';
export type HeadingTag = `h${HeadingLevel}`;

export interface HeadingProps extends DistributiveOmit<TextProps, 'fontSize'> {
	level?: HeadingLevel;
}

export function Heading(props: HeadingProps) {
	const { elementType, level, ...textProps } = props;
	const baseProps = level === undefined ? {} : ({ base: level } as const);

	return (
		<HeadingLevels {...baseProps}>
			{({ element, level: resolvedLevel }) => (
				<HeadingPresenceProvider>
					<Text
						elementType={elementType || element}
						fontSize={`h${resolvedLevel}`}
						fontWeight="bold"
						lineHeight="tight"
						{...textProps}
					/>
				</HeadingPresenceProvider>
			)}
		</HeadingLevels>
	);
}
