import type { ReactNode } from 'react';
import { Text as RacText } from 'react-aria-components/Text';
import { typeStyleWeightRole } from '../../theme/type-styles.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedElementTypeProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { visuallyHiddenStyle } from '../visually-hidden/visually-hidden-style.js';
import type { TextRecipeVariants } from './recipe.css.js';
import { textRecipe } from './recipe.css.js';
import {
	textAdornedContent,
	textAdornment,
	textAdornmentRow,
	textAdornmentSlot,
} from './styles.css.js';

interface TextStyleProps {
	/**
	 * Sets text colour.
	 * @default 'primary'
	 */
	color?: TextRecipeVariants['color'];
	/**
	 * Content after the text, such as an `Icon` or `Kbd`, centred on the capitals of its line. A
	 * block element type places it at the inline end of the first line. An inline element type
	 * places it after the last word.
	 */
	endContent?: ReactNode;
	/**
	 * Sets font style.
	 * @default 'default'
	 */
	fontStyle?: TextRecipeVariants['fontStyle'];
	/**
	 * Sets numeric glyph style.
	 * @default 'default'
	 */
	fontVariantNumeric?: TextRecipeVariants['fontVariantNumeric'];
	/**
	 * Sets the semantic font-weight role. When omitted, the selected typography style supplies its
	 * weight.
	 */
	fontWeight?: TextRecipeVariants['fontWeight'];
	/**
	 * Hides text visually while keeping it accessible.
	 * @default false
	 */
	isVisuallyHidden?: boolean;
	/** Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5. */
	lineClamp?: TextRecipeVariants['lineClamp'];
	/**
	 * Turns cap-height trim on or off. When omitted, trimming is disabled for inline or unknown
	 * element types. Line clamp always disables trim.
	 */
	shouldDisableTrim?: TextRecipeVariants['shouldDisableTrim'];
	/**
	 * Makes text inherit its surrounding font and colour styles.
	 * @default false
	 */
	shouldInheritFont?: TextRecipeVariants['shouldInheritFont'];
	/**
	 * Content before the text, such as an `Icon`, centred on the capitals of the first line. A block
	 * element type hangs wrapped lines after it, and an adornment taller than the line grows the
	 * text instead of overflowing it. An inline element type keeps it in the flow of the text.
	 * Adornments are part of the element, so their text joins its accessible name.
	 */
	startContent?: ReactNode;
	/**
	 * Sets text alignment.
	 * @default 'start'
	 */
	textAlign?: TextRecipeVariants['textAlign'];
	/**
	 * Sets text decoration.
	 * @default 'none'
	 */
	textDecoration?: TextRecipeVariants['textDecoration'];
	/**
	 * Sets text transform.
	 * @default 'none'
	 */
	textTransform?: TextRecipeVariants['textTransform'];
	/**
	 * Sets text wrapping behavior.
	 * @default 'default'
	 */
	textWrap?: TextRecipeVariants['textWrap'];
	/**
	 * Applies a complete typography style: family, size, weight, line height, letter spacing, and
	 * trim.
	 * @default 'body'
	 */
	typography?: TextRecipeVariants['typography'];
}

type _TextOmit = DistributiveOmit<
	React.ComponentProps<typeof RacText>,
	'color' | keyof DocumentedElementTypeProps | 'slot'
>;
interface _TextProps extends _TextOmit, TextStyleProps, DocumentedElementTypeProps {
	/**
	 * Connects text to a React Aria parent's named text slot. Pass `null` to opt out of surrounding
	 * slotted text context.
	 */
	slot?: string | null;
}

/** Props for the `Text` component. */
export type TextProps = Prettify<_TextProps>;

/**
 * Styled text with semantic typography styles and colour controls.
 *
 * Capsize trim is applied to known block text elements and skipped for inline or unknown element
 * types. Set `shouldDisableTrim` explicitly to override this inference. Line clamp always disables
 * trim.
 */
export function Text(props: TextProps) {
	const {
		children,
		className,
		color,
		elementType = 'span',
		endContent,
		fontStyle,
		fontVariantNumeric,
		fontWeight,
		isVisuallyHidden = false,
		lineClamp,
		shouldDisableTrim,
		shouldInheritFont,
		slot,
		startContent,
		style,
		textAlign,
		textDecoration,
		textTransform,
		textWrap,
		typography,
		...racProps
	} = props;
	const hasLineClamp = lineClamp !== undefined && lineClamp !== false;
	const hasAdornments = startContent != null || endContent != null;
	const isBlockElement = blockTextElementTypes.has(elementType);

	const hasAdornmentRow = hasAdornments && isBlockElement;
	const resolvedTypography = typography ?? 'body';

	const resolvedShouldDisableTrim: boolean = (() => {
		if (hasLineClamp) return true;
		if (shouldDisableTrim !== undefined) return shouldDisableTrim;
		return !isBlockElement;
	})();

	const recipeClassName = textRecipe({
		className,
		color,
		fontStyle,
		fontVariantNumeric,
		fontWeight:
			fontWeight ?? (shouldInheritFont ? undefined : typeStyleWeightRole[resolvedTypography]),
		// A block adorned Text clamps its content, not the row around it.
		lineClamp: hasAdornmentRow ? false : lineClamp,
		shouldDisableTrim: resolvedShouldDisableTrim,
		shouldInheritFont,
		textAlign,
		textDecoration,
		textTransform,
		textWrap,
		typography: resolvedTypography,
	});

	return (
		<RacText
			{...racProps}
			className={recipeClassName}
			elementType={elementType}
			// @ts-expect-error — RAC TextProps omits null, which opts out of slotted context at runtime.
			slot={slot}
			style={isVisuallyHidden ? { ...visuallyHiddenStyle, ...style } : style}
		>
			<TextContent
				endContent={endContent}
				hasAdornmentRow={hasAdornmentRow}
				isFlowContent={flowContentElementTypes.has(elementType)}
				lineClamp={lineClamp}
				startContent={startContent}
				textAlign={textAlign}
			>
				{children}
			</TextContent>
		</RacText>
	);
}

// Block text elements whose content model is flow content, so adorned text may hold blocks.
const flowContentElementTypes = new Set<NonNullable<TextProps['elementType']>>([
	'blockquote',
	'div',
]);

const blockTextElementTypes = new Set<NonNullable<TextProps['elementType']>>([
	'blockquote',
	'div',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'p',
	'pre',
]);

/** Keeps inline adornments in text flow and block adornments inside the root's trim boxes. */
function TextContent({
	children,
	endContent,
	hasAdornmentRow,
	isFlowContent,
	lineClamp,
	startContent,
	textAlign,
}: Pick<TextProps, 'children' | 'endContent' | 'lineClamp' | 'startContent' | 'textAlign'> & {
	hasAdornmentRow: boolean;
	isFlowContent: boolean;
}) {
	if (startContent == null && endContent == null) return children;
	if (!hasAdornmentRow) {
		return (
			<>
				{startContent != null && (
					<span className={textAdornment({ inlineSide: 'start' })}>{startContent}</span>
				)}
				{children}
				{endContent != null && (
					<span className={textAdornment({ inlineSide: 'end' })}>{endContent}</span>
				)}
			</>
		);
	}

	const Wrapper = isFlowContent ? 'div' : 'span';
	// Inherits the root's font and colour, like Button's label, so `lineClamp` uses Text's rules.
	const contentClassName = textRecipe({
		className: textAdornedContent,
		lineClamp,
		shouldDisableTrim: true,
		shouldInheritFont: true,
		textAlign,
	});

	return (
		<Wrapper className={textAdornmentRow}>
			{startContent != null && (
				<Wrapper className={textAdornmentSlot}>
					<span className={textAdornment()}>{startContent}</span>
				</Wrapper>
			)}
			<Wrapper className={contentClassName}>{children}</Wrapper>
			{endContent != null && (
				<Wrapper className={textAdornmentSlot}>
					<span className={textAdornment()}>{endContent}</span>
				</Wrapper>
			)}
		</Wrapper>
	);
}
