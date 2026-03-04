import { Text as RacText } from 'react-aria-components';
import * as styles from '../../../recipes/text.css.js';
import type { FontSizeToken, LineHeightToken } from '../../../tokens.js';
import { cx } from '../../../utils.js';

type TextLineClampNumber = Exclude<styles.TextLineClampVariant, 'none'>;

/** Props for the primitive text component. */
export type TextProps = React.ComponentProps<typeof RacText> & {
	color?: styles.TextColor;
	fontFamily?: styles.TextFontFamily;
	fontSize?: FontSizeToken;
	fontWeight?: styles.TextFontWeight;
	lineHeight?: LineHeightToken;
	/** Controls trim behavior. Defaults to true when `lineClamp` is set. */
	shouldDisableTrim?: boolean;
	textAlign?: styles.TextAlign;
	textDecoration?: styles.TextDecoration;
	textTransform?: styles.TextTransform;
	/** `true` clamps to one line. A number clamps to that many lines. */
	lineClamp?: boolean | TextLineClampNumber;
	variant?: styles.TextVariant;
	isVisuallyHidden?: boolean | undefined;
};

function resolveLineClampVariant(
	lineClamp: boolean | TextLineClampNumber | undefined,
): styles.TextLineClampVariant {
	if (lineClamp === undefined || lineClamp === false) return 'none';
	if (lineClamp === true) return 1;
	return lineClamp;
}

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
		shouldDisableTrim,
		textAlign,
		textDecoration,
		textTransform,
		variant,
		...racProps
	} = props;
	const hasLineClamp = lineClamp !== undefined && lineClamp !== false;
	const resolvedShouldDisableTrim = shouldDisableTrim ?? hasLineClamp;
	const lineClampVariant = resolveLineClampVariant(lineClamp);

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
					shouldDisableTrim: resolvedShouldDisableTrim,
					textAlign,
					textDecoration,
					textTransform,
					lineClamp: lineClampVariant,
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
