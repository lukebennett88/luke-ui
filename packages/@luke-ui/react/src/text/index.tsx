import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../recipes/text.css.js';
import { cx } from '../utils/index.js';

interface TextVariantProps extends NonNullable<styles.TextVariants> {}

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
	 * Sets the semantic font-weight role.
	 * @default 'body'
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
	 * Turns off cap-height trim. Trimming is disabled automatically when `lineClamp` is set.
	 * @default false
	 */
	shouldDisableTrim?: TextVariantProps['shouldDisableTrim'];
	/**
	 * Makes text inherit its surrounding font and colour styles.
	 * @default false
	 */
	shouldInheritFont?: TextVariantProps['shouldInheritFont'];
	/**
	 * Sets the font size, line height, letter spacing, and trim as one step.
	 * @default '300'
	 */
	size?: TextVariantProps['size'];
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
}

/**
 * Props for the primitive text component.
 *
 * @tier atom
 */
export type TextProps = Omit<React.ComponentProps<typeof RacText>, keyof TextStyleProps> &
	TextStyleProps;

/** Styled text with a coordinated type scale and semantic colour controls. */
export function Text(props: TextProps) {
	const {
		children,
		className,
		color,
		fontVariantNumeric,
		fontWeight,
		isVisuallyHidden,
		lineClamp,
		shouldDisableTrim,
		shouldInheritFont,
		size,
		textAlign,
		textDecoration,
		textTransform,
		textWrap,
		...racProps
	} = props;
	const hasLineClamp = lineClamp !== undefined && lineClamp !== false;
	const resolvedShouldDisableTrim = shouldDisableTrim ?? hasLineClamp;

	return (
		<RacText
			{...racProps}
			className={cx(
				styles.text({
					color,
					fontVariantNumeric,
					fontWeight,
					isVisuallyHidden,
					lineClamp,
					shouldDisableTrim: resolvedShouldDisableTrim,
					shouldInheritFont,
					size,
					textAlign,
					textDecoration,
					textTransform,
					textWrap,
				}),
				className,
			)}
		>
			{children}
		</RacText>
	);
}
