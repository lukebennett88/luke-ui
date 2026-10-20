import type { CSSProperties, HTMLAttributes, JSX, ReactElement, ReactNode, Ref } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import { typeStyleWeightRole } from '../../theme/type-styles.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { UseRenderRef } from '../use-render/use-render.js';
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

type _TextRacOmit = DistributiveOmit<
	RacTextProps,
	'children' | 'className' | 'color' | 'elementType' | 'render' | 'slot' | 'style'
>;

interface TextSharedProps extends _TextRacOmit, TextStyleProps {
	/** Content of the text element. */
	children?: ReactNode;
	/** Class name on the text root. */
	className?: string;
	/** Ref to the rendered text root. */
	ref?: Ref<HTMLElement>;
	/**
	 * Connects text to a React Aria parent's named text slot. Pass `null` to opt out of surrounding
	 * slotted text context.
	 */
	slot?: string | null;
	/** Inline style on the text root. Wins over the visually-hidden styles when both apply. */
	style?: CSSProperties;
}

/** Props when `Text` renders a supported element itself. */
export interface TextElementProps extends TextSharedProps {
	/**
	 * Renders a different element type in place of the default. Use it to choose a semantic element
	 * without changing the visual or accessibility treatment.
	 * @default 'span'
	 */
	elementType?: RacTextProps['elementType'];
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

/** Resolved props handed to a caller-owned `renderRoot` element. */
type TextResolvedRenderProps = Omit<HTMLAttributes<HTMLElement>, 'ref'> & { ref: UseRenderRef };

/** Props when a caller owns the rendered element. */
export interface TextRenderRootProps extends TextSharedProps {
	/** Use `elementType` instead of `renderRoot` for a supported semantic element. */
	elementType?: never;
	/**
	 * Passes resolved DOM props, presentation, and a callback `ref` as `domProps`. The second
	 * argument is an empty state object. `Text` callbacks return a `<span>`; use `elementType` for a
	 * semantic element. `Heading` supplies its resolved heading element in the render state.
	 */
	renderRoot: (domProps: TextResolvedRenderProps, state: Record<string, never>) => ReactElement;
}

/** Props for the `Text` component. */
export type TextProps = Prettify<TextElementProps | TextRenderRootProps>;

const blockTextElementTypes = new Set<string>([
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
	return (
		<TextRoot
			elementType={props.renderRoot ? 'span' : (props.elementType ?? 'span')}
			props={props}
		/>
	);
}

/** React Aria Text root used by Text and Heading with an explicit expected element type. */
export function TextRoot({
	elementType,
	props,
}: {
	elementType: string;
	props: TextProps;
}): JSX.Element {
	const {
		children,
		className,
		color,
		fontStyle,
		fontVariantNumeric,
		fontWeight,
		isVisuallyHidden = false,
		lineClamp,
		ref,
		renderRoot,
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
	const resolvedTypography: NonNullable<TextRecipeVariants['typography']> = typography ?? 'body';
	const ownsRoot = renderRoot != null;

	const resolvedShouldDisableTrim: boolean = (() => {
		if (hasLineClamp) return true;
		if (shouldDisableTrim !== undefined) return shouldDisableTrim;
		// A caller-owned root is an unknown element type, so trim stays off unless asked for.
		// Heading and other block owners that know their semantics pass `shouldDisableTrim={false}`.
		if (ownsRoot) return true;
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

	const resolvedStyle = isVisuallyHidden ? { ...visuallyHiddenStyle, ...style } : style;

	return (
		<RacText
			{...racProps}
			className={recipeClassName}
			elementType={elementType}
			ref={ref}
			// RAC's render callback must return the element named by elementType. Text uses its
			// default span; Heading supplies its resolved h1–h6 element through TextRoot.
			render={renderRoot ? (domProps) => renderRoot(domProps, {}) : undefined}
			// @ts-expect-error — RAC TextProps omits null, which opts out of slotted context at runtime.
			slot={slot}
			style={resolvedStyle}
		>
			{children}
		</RacText>
	);
}
