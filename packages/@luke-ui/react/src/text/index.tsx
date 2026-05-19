import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../recipes/text.css.js';
import { cx } from '../utils/index.js';

interface TextVariantProps extends NonNullable<styles.TextVariants> {}

interface TextStyleProps {
	/**
	 * Sets text color.
	 * @default 'neutralBold'
	 */
	color?: TextVariantProps['color'];
	/**
	 * Sets the font family.
	 * @default 'sans'
	 */
	fontFamily?: TextVariantProps['fontFamily'];
	/**
	 * Sets the font size.
	 * @default 'standard'
	 */
	fontSize?: TextVariantProps['fontSize'];
	/**
	 * Sets the font weight.
	 * @default 'regular'
	 */
	fontWeight?: TextVariantProps['fontWeight'];
	/**
	 * Sets the line height.
	 * @default 'loose'
	 */
	lineHeight?: TextVariantProps['lineHeight'];
	/**
	 * Makes text inherit font styles.
	 * @default false
	 */
	shouldInheritFont?: TextVariantProps['shouldInheritFont'];
	/**
	 * Turns off cap-height trim.
	 * @default false
	 */
	shouldDisableTrim?: TextVariantProps['shouldDisableTrim'];
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
	/** Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5. */
	lineClamp?: TextVariantProps['lineClamp'];
	/**
	 * Sets numeric glyph style.
	 * @default 'unset'
	 */
	variant?: TextVariantProps['variant'];
	/**
	 * Hides text visually while keeping it accessible.
	 * @default false
	 */
	isVisuallyHidden?: TextVariantProps['isVisuallyHidden'];
}

/**
 * Props for the primitive text component.
 *
 * @tier atom
 */
export type TextProps = Omit<React.ComponentProps<typeof RacText>, keyof TextStyleProps> &
	TextStyleProps;

/** Styled text component with token-based typography controls. */
export function Text(props: TextProps) {
	const {
		children,
		className,
		color,
		fontFamily,
		fontSize,
		fontWeight,
		isVisuallyHidden,
		lineClamp,
		lineHeight,
		shouldInheritFont,
		shouldDisableTrim,
		textAlign,
		textDecoration,
		textTransform,
		variant,
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
					fontFamily,
					fontSize,
					fontWeight,
					lineHeight,
					shouldInheritFont,
					shouldDisableTrim: resolvedShouldDisableTrim,
					textAlign,
					textDecoration,
					textTransform,
					lineClamp,
					variant,
					isVisuallyHidden,
				}),
				className,
			)}
		>
			{children}
		</RacText>
	);
}
