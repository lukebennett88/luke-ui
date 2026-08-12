import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { Prettify } from '../types/prettify.js';
import type { HeadingLevel, HeadingLevelsProps } from './heading-context.js';
import { HeadingLevels, HeadingPresenceProvider } from './heading-context.js';

export type {
	HeadingLevel,
	HeadingLevelsProps,
	HeadingLevelsRenderProps,
} from './heading-context.js';
export { HeadingLevels } from './heading-context.js';
/** Valid heading tag name for Luke UI headings. */
export type HeadingTag = `h${HeadingLevel}`;

interface _HeadingProps extends TextProps {
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
}

/** Props for `Heading`. */
export type HeadingProps = Prettify<_HeadingProps>;

const typographyByLevel = {
	1: 'heading1',
	2: 'heading2',
	3: 'heading3',
	4: 'heading4',
	// h5/h6 stay in the outline without inventing heading5/heading6 type styles.
	5: 'lead',
	6: 'body',
} as const satisfies Record<HeadingLevel, NonNullable<TextProps['typography']>>;

/** Semantic heading with automatic level composition and level-based typography. */
export function Heading(props: HeadingProps) {
	const { elementType, fontWeight = 'heading', level, typography, ...textProps } = props;
	const baseProps: Pick<HeadingLevelsProps, 'base'> = level === undefined ? {} : { base: level };

	return (
		<HeadingLevels {...baseProps}>
			{({ element, level: resolvedLevel }) => (
				<HeadingPresenceProvider>
					<Text
						elementType={elementType || element}
						fontWeight={fontWeight}
						typography={typography ?? typographyByLevel[resolvedLevel]}
						{...textProps}
					/>
				</HeadingPresenceProvider>
			)}
		</HeadingLevels>
	);
}
