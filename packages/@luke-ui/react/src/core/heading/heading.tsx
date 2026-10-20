import type { TextElementProps, TextRenderRootProps } from '../text/text.js';
import { Text, TextRoot } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { HeadingLevel } from './heading-context.js';
import { HeadingPresenceProvider, useHeadingLevel } from './heading-context.js';
import { headingDefaultFontWeight, headingTypographyByLevel } from './heading-typography.js';

export type { HeadingLevel } from './heading-context.js';
export { HeadingLevels, useHeadingLevel } from './heading-context.js';

/** Resolved heading semantics supplied to a caller-owned heading root. */
export type HeadingRenderRootState = {
	element: `h${HeadingLevel}`;
	level: HeadingLevel;
};

type HeadingRenderRoot = (
	domProps: Parameters<NonNullable<TextRenderRootProps['renderRoot']>>[0],
	state: HeadingRenderRootState,
) => ReturnType<NonNullable<TextRenderRootProps['renderRoot']>>;

// Text props are a union (`elementType` vs `renderRoot`), so each branch stays a type alias.
type _HeadingElementProps = DistributiveOmit<TextElementProps, 'fontWeight' | 'typography'>;
type _HeadingRenderRootProps = DistributiveOmit<
	TextRenderRootProps,
	'fontWeight' | 'typography' | 'renderRoot'
> & {
	/** Receives the resolved element and level. Return that heading element to preserve semantics. */
	renderRoot: HeadingRenderRoot;
};
type _HeadingProps = (_HeadingElementProps | _HeadingRenderRootProps) & {
	/**
	 * Sets the semantic font-weight role. Explicit values override the heading default.
	 * @default 'heading'
	 */
	fontWeight?: TextElementProps['fontWeight'];
	/** Heading level override. Inherits from context when omitted. */
	level?: HeadingLevel;
	/**
	 * Applies a complete typography style: family, size, weight, line height, letter spacing, and
	 * trim. When omitted, the style follows the resolved heading level: `heading1`–`heading4` for
	 * levels 1–4, `lead` for 5, and `body` for 6. The default level comes from `HeadingLevels`
	 * context when `level` is omitted.
	 */
	typography?: TextElementProps['typography'];
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
		shouldDisableTrim,
		typography,
		...textProps
	} = props;
	const { level: contextLevel } = useHeadingLevel();
	const resolvedLevel = level ?? contextLevel;
	const resolvedTypography = typography ?? headingTypographyByLevel[resolvedLevel];
	const headingElement = `h${resolvedLevel}` as const;

	if (renderRoot) {
		return (
			<HeadingPresenceProvider>
				<TextRoot
					elementType={headingElement}
					props={{
						...textProps,
						fontWeight,
						renderRoot: (domProps) =>
							renderRoot(domProps, { element: headingElement, level: resolvedLevel }),
						shouldDisableTrim,
						typography: resolvedTypography,
					}}
				/>
			</HeadingPresenceProvider>
		);
	}

	return (
		<HeadingPresenceProvider>
			<Text
				elementType={elementType || headingElement}
				fontWeight={fontWeight}
				shouldDisableTrim={shouldDisableTrim}
				typography={resolvedTypography}
				{...textProps}
			/>
		</HeadingPresenceProvider>
	);
}
