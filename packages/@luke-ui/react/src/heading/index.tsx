import type { HeadingLevel, HeadingLevelsProps } from '../heading-context/index.js';
import { HeadingLevels, HeadingPresenceProvider } from '../heading-context/index.js';
import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';

export type { HeadingLevel } from '../heading-context/index.js';
/** Valid heading tag name for Luke UI headings. */
export type HeadingTag = `h${HeadingLevel}`;

/**
 * Props for `Heading`.
 *
 * @tier atom
 */
export interface HeadingProps extends DistributiveOmit<TextProps, 'fontSize'> {
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
}

/** Heading component with automatic level composition. */
export function Heading(props: HeadingProps) {
	const { elementType, level, ...textProps } = props;
	const baseProps: Pick<HeadingLevelsProps, 'base'> = level === undefined ? {} : { base: level };

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
