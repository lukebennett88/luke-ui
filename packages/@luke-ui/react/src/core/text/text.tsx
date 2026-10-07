import { Text as RacText } from 'react-aria-components/Text';
import { typeStyleWeightRole } from '../../theme/type-styles.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedElementTypeProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { visuallyHiddenStyle } from '../visually-hidden/visually-hidden-style.js';
import type { TextRecipeVariants } from './recipe.css.js';
import { textRecipe } from './recipe.css.js';

interface TextStyleProps {
	/**
	 * Sets text colour.
	 * @default 'primary'
	 */
	color?: TextRecipeVariants['color'];
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
		fontStyle,
		fontVariantNumeric,
		fontWeight,
		isVisuallyHidden = false,
		lineClamp,
		shouldDisableTrim,
		shouldInheritFont,
		slot,
		style,
		textAlign,
		textDecoration,
		textTransform,
		textWrap,
		typography,
		...racProps
	} = props;
	const hasLineClamp = lineClamp !== undefined && lineClamp !== false;
	const resolvedTypography = typography ?? 'body';

	const resolvedShouldDisableTrim: boolean = (() => {
		if (hasLineClamp) return true;
		if (shouldDisableTrim !== undefined) return shouldDisableTrim;
		return !blockTextElementTypes.has(elementType);
	})();

	const recipeClassName = textRecipe({
		className,
		color,
		fontStyle,
		fontVariantNumeric,
		fontWeight:
			fontWeight ?? (shouldInheritFont ? undefined : typeStyleWeightRole[resolvedTypography]),
		lineClamp,
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
			{children}
		</RacText>
	);
}
