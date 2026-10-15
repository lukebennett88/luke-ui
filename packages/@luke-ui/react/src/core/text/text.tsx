import type { ReactNode } from 'react';
import { Text as RacText } from 'react-aria-components/Text';
import { cx } from '../../shared/utils/utils.js';
import { typeStyleWeightRole } from '../../theme/type-styles.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedElementTypeProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { visuallyHiddenStyle } from '../visually-hidden/visually-hidden-style.js';
import type { TextRecipeVariants } from './recipe.css.js';
import { textRecipe } from './recipe.css.js';
import { textAdornedContent, textAdornment, textAdornmentRow } from './styles.css.js';

interface TextStyleProps {
	/**
	 * Sets text colour.
	 * @default 'primary'
	 */
	color?: TextRecipeVariants['color'];
	/**
	 * Content after the text, at the inline end of the row. It is aligned with the text's first line
	 * like `startContent`.
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
	 * Content before the text, such as an `Icon`. A graphic is centred on the text's first line, and
	 * wrapped lines align with the text, not with this content. A taller graphic grows the row rather
	 * than overflowing it. It takes phrasing content and is part of the element, so its text joins
	 * the element's accessible name.
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
	const resolvedTypography = typography ?? 'body';

	const resolvedShouldDisableTrim: boolean = (() => {
		if (hasLineClamp) return true;
		// An inline adorned Text is itself the row, so trim boxes would become flex items.
		if (hasAdornments && !isBlockElement) return true;
		if (shouldDisableTrim !== undefined) return shouldDisableTrim;
		return !isBlockElement;
	})();

	const recipeClassName = textRecipe({
		className:
			hasAdornments && !isBlockElement
				? cx(textAdornmentRow({ isInline: true }), className)
				: className,
		color,
		fontStyle,
		fontVariantNumeric,
		fontWeight:
			fontWeight ?? (shouldInheritFont ? undefined : typeStyleWeightRole[resolvedTypography]),
		// An adorned Text clamps its content, not the row around it.
		lineClamp: hasAdornments ? false : lineClamp,
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
			{hasAdornments ? (
				<TextAdornments
					endContent={endContent}
					isBlockElement={isBlockElement}
					lineClamp={lineClamp}
					startContent={startContent}
					textAlign={textAlign}
				>
					{children}
				</TextAdornments>
			) : (
				children
			)}
		</RacText>
	);
}

/** Lays out the adornments and the text. A block Text gets a row inside its trim boxes. */
function TextAdornments({
	children,
	endContent,
	isBlockElement,
	lineClamp,
	startContent,
	textAlign,
}: {
	children: ReactNode;
	endContent: ReactNode;
	isBlockElement: boolean;
	lineClamp: TextProps['lineClamp'];
	startContent: ReactNode;
	textAlign: TextProps['textAlign'];
}) {
	// Inherits the root's font and colour, like Button's label, so `lineClamp` uses Text's rules.
	const contentClassName = textRecipe({
		className: textAdornedContent,
		lineClamp,
		shouldDisableTrim: true,
		shouldInheritFont: true,
		textAlign,
	});

	const parts = (
		<>
			{startContent != null && <span className={textAdornment}>{startContent}</span>}
			<span className={contentClassName}>{children}</span>
			{endContent != null && <span className={textAdornment}>{endContent}</span>}
		</>
	);

	if (!isBlockElement) return parts;

	return <span className={textAdornmentRow({ isInline: false })}>{parts}</span>;
}
