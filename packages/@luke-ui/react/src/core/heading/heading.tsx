import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { HeadingLevel } from './heading-context.js';
import { HeadingPresenceProvider, useHeadingLevel } from './heading-context.js';
import { headingDefaultFontWeight, headingTypographyByLevel } from './heading-typography.js';

export type { HeadingLevel } from './heading-context.js';
export { HeadingLevels, useHeadingLevel } from './heading-context.js';

// `TextProps` is a union (`elementType` vs `renderRoot`), so the omit stays a type alias.
type _HeadingProps = DistributiveOmit<TextProps, 'fontWeight' | 'typography'> & {
	/**
	 * Sets the semantic font-weight role. Explicit values override the heading default.
	 * @default 'heading'
	 */
	fontWeight?: TextProps['fontWeight'];
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
	/**
	 * Applies a complete typography style: family, size, weight, line height, letter spacing, and
	 * trim. When omitted, the style follows the resolved heading level: `heading1`–`heading4` for
	 * levels 1–4, `lead` for 5, and `body` for 6. The default level comes from `HeadingLevels`
	 * context when `level` is omitted.
	 */
	typography?: TextProps['typography'];
};

/** Props for `Heading`. */
export type HeadingProps = Prettify<_HeadingProps>;

/** Semantic heading with automatic level composition and level-based typography. */
export function Heading(props: HeadingProps) {
	const {
		elementType,
		fontWeight = headingDefaultFontWeight,
		level,
		renderRoot,
		typography,
		...textProps
	} = props;
	const { level: contextLevel } = useHeadingLevel();
	const resolvedLevel = level ?? contextLevel;
	const resolvedTypography = typography ?? headingTypographyByLevel[resolvedLevel];

	return (
		<HeadingPresenceProvider>
			{renderRoot ? (
				<Text
					fontWeight={fontWeight}
					renderRoot={renderRoot}
					typography={resolvedTypography}
					{...textProps}
				/>
			) : (
				<Text
					elementType={elementType || `h${resolvedLevel}`}
					fontWeight={fontWeight}
					typography={resolvedTypography}
					{...textProps}
				/>
			)}
		</HeadingPresenceProvider>
	);
}
