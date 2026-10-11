import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { Prettify } from '../types/prettify.js';
import type { HeadingLevel } from './heading-context.js';
import { HeadingPresenceProvider, useHeadingLevel } from './heading-context.js';
import { headingDefaultFontWeight, headingTypographyByLevel } from './heading-typography.js';

export type { HeadingLevel } from './heading-context.js';
export { HeadingLevels, useHeadingLevel } from './heading-context.js';

interface _HeadingProps extends TextProps {
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
}

/** Props for `Heading`. */
export type HeadingProps = Prettify<_HeadingProps>;

/** Semantic heading with automatic level composition and level-based typography. */
export function Heading(props: HeadingProps) {
	const {
		elementType,
		fontWeight = headingDefaultFontWeight,
		level,
		typography,
		...textProps
	} = props;
	const { level: contextLevel } = useHeadingLevel();
	const resolvedLevel = level ?? contextLevel;

	return (
		<HeadingPresenceProvider>
			<Text
				elementType={elementType || `h${resolvedLevel}`}
				fontWeight={fontWeight}
				typography={typography ?? headingTypographyByLevel[resolvedLevel]}
				{...textProps}
			/>
		</HeadingPresenceProvider>
	);
}
