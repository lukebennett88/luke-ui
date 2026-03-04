import type { DistributiveOmit } from '../../../types.js';
import type { TextProps } from '../primitives/text.js';
import { Text } from '../primitives/text.js';
import type { HeadingLevel } from './heading-context.js';
import { HeadingLevels, HeadingPresenceProvider } from './heading-context.js';

export type { HeadingLevel } from './heading-context.js';
/** Valid heading tag name for Luke UI headings. */
export type HeadingTag = `h${HeadingLevel}`;

/** Props for `Heading`. */
export interface HeadingProps extends DistributiveOmit<TextProps, 'fontSize'> {
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
}

/** Heading component with automatic level composition. */
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
