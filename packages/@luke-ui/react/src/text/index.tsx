import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../recipes/text.css.js';
import { cx } from '../utils/index.js';

interface TextVariantProps extends NonNullable<styles.TextVariants> {}

interface TextStyleProps {
	/** Sets text color. */
	color?: TextVariantProps['color'];
	/** Sets the font family. */
	fontFamily?: TextVariantProps['fontFamily'];
	/** Sets the font size. */
	fontSize?: TextVariantProps['fontSize'];
	/** Sets the font weight. */
	fontWeight?: TextVariantProps['fontWeight'];
	/** Sets the line height. */
	lineHeight?: TextVariantProps['lineHeight'];
	/** Makes text inherit font styles. */
	shouldInheritFont?: TextVariantProps['shouldInheritFont'];
	/** Turns off cap-height trim. */
	shouldDisableTrim?: TextVariantProps['shouldDisableTrim'];
	/** Sets text alignment. */
	textAlign?: TextVariantProps['textAlign'];
	/** Sets text decoration. */
	textDecoration?: TextVariantProps['textDecoration'];
	/** Sets text transform. */
	textTransform?: TextVariantProps['textTransform'];
	/** Clamps text lines. */
	lineClamp?: TextVariantProps['lineClamp'];
	/** Sets numeric glyph style. */
	variant?: TextVariantProps['variant'];
	/** Hides text visually. */
	isVisuallyHidden?: TextVariantProps['isVisuallyHidden'];
}

/** Props for the primitive text component. */
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
