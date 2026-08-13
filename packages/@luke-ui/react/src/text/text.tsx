import { Text as RacText } from 'react-aria-components/Text';
import { typeStyleWeightRole } from '../theme/contract.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/utils.js';
import type { TextRecipeVariants } from './recipe.css.js';
import { textRecipe } from './recipe.css.js';

interface TextVariantProps extends NonNullable<TextRecipeVariants> {}

interface TextStyleProps {
	/**
	 * Sets text colour.
	 * @default 'primary'
	 */
	color?: TextVariantProps['color'];
	/**
	 * Sets numeric glyph style.
	 * @default 'unset'
	 */
	fontVariantNumeric?: TextVariantProps['fontVariantNumeric'];
	/**
	 * Sets the semantic font-weight role. When omitted, the selected typography style supplies its
	 * weight.
	 */
	fontWeight?: TextVariantProps['fontWeight'];
	/**
	 * Hides text visually while keeping it accessible.
	 * @default false
	 */
	isVisuallyHidden?: TextVariantProps['isVisuallyHidden'];
	/** Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5. */
	lineClamp?: TextVariantProps['lineClamp'];
	/**
	 * Turns cap-height trim on or off. When omitted, trimming is disabled for inline or unknown
	 * element types. Line clamp always disables trim.
	 */
	shouldDisableTrim?: TextVariantProps['shouldDisableTrim'];
	/**
	 * Makes text inherit its surrounding font and colour styles.
	 * @default false
	 */
	shouldInheritFont?: TextVariantProps['shouldInheritFont'];
	/**
	 * Sets text alignment.
	 * @default 'start'
	 */
	textAlign?: TextVariantProps['textAlign'];
	/**
	 * Sets text decoration.
	 * @default 'none'
	 */
	textDecoration?: TextVariantProps['textDecoration'];
	/**
	 * Sets text transform.
	 * @default 'none'
	 */
	textTransform?: TextVariantProps['textTransform'];
	/**
	 * Sets text wrapping behavior.
	 * @default 'unset'
	 */
	textWrap?: TextVariantProps['textWrap'];
	/**
	 * Applies a complete typography style: family, size, weight, line height, letter spacing, and
	 * trim.
	 * @default 'body'
	 */
	typography?: TextVariantProps['typography'];
}

type _TextOmit = DistributiveOmit<React.ComponentProps<typeof RacText>, 'color'>;
interface _TextProps extends _TextOmit, TextStyleProps {}

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
		fontVariantNumeric,
		fontWeight,
		isVisuallyHidden,
		lineClamp,
		shouldDisableTrim,
		shouldInheritFont,
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

	return (
		<RacText
			{...racProps}
			className={cx(
				textRecipe({
					color,
					fontVariantNumeric,
					...(shouldInheritFont
						? {}
						: { fontWeight: fontWeight ?? typeStyleWeightRole[resolvedTypography] }),
					isVisuallyHidden,
					lineClamp,
					shouldDisableTrim: resolvedShouldDisableTrim,
					shouldInheritFont,
					textAlign,
					textDecoration,
					textTransform,
					textWrap,
					typography: resolvedTypography,
				}),
				className,
			)}
			elementType={elementType}
		>
			{children}
		</RacText>
	);
}
