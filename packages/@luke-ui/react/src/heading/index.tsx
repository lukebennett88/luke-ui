import type { HeadingLevel, HeadingLevelsProps } from '../heading-context/index.js';
import { HeadingLevels, HeadingPresenceProvider } from '../heading-context/index.js';
import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';

export type { HeadingLevel } from '../heading-context/index.js';
/** Valid heading tag name for Luke UI headings. */
export type HeadingTag = `h${HeadingLevel}`;

/**
 * Props for `Heading`.
 *
 * @tier atom
 */
export interface HeadingProps extends TextProps {
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
}

const sizeByLevel = { 1: 800, 2: 700, 3: 600, 4: 500, 5: 400, 6: 300 } as const;

/** Semantic heading with automatic level composition and level-based typography. */
export function Heading(props: HeadingProps) {
	const { elementType, fontWeight = 'heading', level, size, ...textProps } = props;
	const baseProps: Pick<HeadingLevelsProps, 'base'> = level === undefined ? {} : { base: level };

	return (
		<HeadingLevels {...baseProps}>
			{({ element, level: resolvedLevel }) => (
				<HeadingPresenceProvider>
					<Text
						elementType={elementType || element}
						fontWeight={fontWeight}
						size={size ?? sizeByLevel[resolvedLevel]}
						{...textProps}
					/>
				</HeadingPresenceProvider>
			)}
		</HeadingLevels>
	);
}
