import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { Text as RacText } from 'react-aria-components/Text';
import { cx } from '../../shared/utils/utils.js';
import { typeStyleWeightRole } from '../../theme/type-styles.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
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
	 * Content after the text, such as an `Icon`, `Kbd`, or `IconButton`, centred on the capitals of
	 * its line in this Text's typography. A block element type places it at the inline end of the
	 * first line. An inline element type places it after the last word.
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
	 * Space between each adornment and the text, as a spacing token or a responsive object of them.
	 * When omitted, block element types use `sp8` and inline element types use `sp4`.
	 */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
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
	 * Content before the text, such as an `Icon` or an avatar, centred on the capitals of the first
	 * line in this Text's typography. A block element type hangs wrapped lines after it, and an
	 * adornment taller than the line grows the text instead of overflowing it. An inline element type
	 * keeps it in the flow of the text. With `div` or `blockquote` content, the first line must use
	 * this Text's typography: set `typography` here and `shouldInheritFont` on the nested text that
	 * renders that line. Adornments are part of the element, so their text joins its accessible
	 * name.
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
		gap,
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
				gap={gap}
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
	gap,
	hasAdornmentRow,
	isFlowContent,
	lineClamp,
	startContent,
	textAlign,
}: Pick<
	TextProps,
	'children' | 'endContent' | 'gap' | 'lineClamp' | 'startContent' | 'textAlign'
> & {
	hasAdornmentRow: boolean;
	isFlowContent: boolean;
}) {
	if (startContent == null && endContent == null) return children;
	if (!hasAdornmentRow) {
		const startGap = createSprinkles({ marginInlineEnd: gap });
		const endGap = createSprinkles({ marginInlineStart: gap });
		return (
			<>
				{startContent != null && (
					<span
						{...startGap}
						className={textAdornment({
							className: startGap.className,
							inlineSide: 'start',
						})}
					>
						{startContent}
					</span>
				)}
				{children}
				{endContent != null && (
					<span
						{...endGap}
						className={textAdornment({
							className: endGap.className,
							inlineSide: 'end',
						})}
					>
						{endContent}
					</span>
				)}
			</>
		);
	}

	return (
		<BlockTextContent
			endContent={endContent}
			gap={gap}
			isFlowContent={isFlowContent}
			lineClamp={lineClamp}
			startContent={startContent}
			textAlign={textAlign}
		>
			{children}
		</BlockTextContent>
	);
}

function BlockTextContent({
	children,
	endContent,
	gap,
	isFlowContent,
	lineClamp,
	startContent,
	textAlign,
}: Pick<
	TextProps,
	'children' | 'endContent' | 'gap' | 'lineClamp' | 'startContent' | 'textAlign'
> & {
	isFlowContent: boolean;
}) {
	const contentRef = useRef<HTMLElement | null>(null);
	useLayoutEffect(() => {
		try {
			if (process.env.NODE_ENV !== 'production' && isFlowContent) {
				warnOnMismatchedPrimaryText(contentRef.current);
			}
		} catch (error) {
			// Without a bundler that replaces `process.env.NODE_ENV`, `process` may be undefined. The
			// whole check sits inside `try` so a production build folds it away.
			if (!(error instanceof ReferenceError)) throw error;
		}
	}, [isFlowContent]);
	const Wrapper = isFlowContent ? 'div' : 'span';
	// Inherits the root's font and colour, like Button's label, so `lineClamp` uses Text's rules.
	const contentClassName = textRecipe({
		className: textAdornedContent,
		lineClamp,
		shouldDisableTrim: true,
		shouldInheritFont: true,
		textAlign,
	});
	const rowGap = createSprinkles({ gap });

	return (
		<Wrapper {...rowGap} className={cx(textAdornmentRow, rowGap.className)}>
			{startContent != null && (
				<Wrapper className={textAdornmentSlot}>
					<span className={textAdornment()}>{startContent}</span>
				</Wrapper>
			)}
			<Wrapper
				className={contentClassName}
				// A callback ref types the content as `HTMLElement` for both wrapper tags.
				ref={(element: HTMLElement | null) => {
					contentRef.current = element;
				}}
			>
				{children}
			</Wrapper>
			{endContent != null && (
				<Wrapper className={textAdornmentSlot}>
					<span className={textAdornment()}>{endContent}</span>
				</Wrapper>
			)}
		</Wrapper>
	);
}

const warnedRoots = new WeakSet<Element>();
const fontMetricProperties = ['font-family', 'font-size', 'line-height'];

/**
 * Development check for a flow root: its adornments follow the root's typography, so its first
 * rendered text must use the same font metrics for the adornments to centre on that line.
 */
function warnOnMismatchedPrimaryText(content: HTMLElement | null): void {
	const root = content?.parentElement?.parentElement;
	if (content == null || root == null || warnedRoots.has(root)) return;
	const primary = findPrimaryTextElement(content);
	if (primary == null) return;

	const rootStyle = getComputedStyle(root);
	const primaryStyle = getComputedStyle(primary);
	const mismatches = fontMetricProperties.filter((property) => {
		return rootStyle.getPropertyValue(property) !== primaryStyle.getPropertyValue(property);
	});
	if (mismatches.length === 0) return;

	warnedRoots.add(root);
	// oxlint-disable-next-line no-console -- development-only guidance, stripped from production builds
	console.error(
		`Text: the first text inside this adorned <${root.localName}> has a different ${mismatches.join(', ')} from the Text, so the adornments do not centre on its first line. Adornments follow the Text's own typography. Set \`typography\` on the Text to the first line's style, and set \`shouldInheritFont\` on the text that renders that line.`,
		root,
	);
}

// Text that never renders a visible first line, such as an icon's title or a hidden hint.
const ignoredTextSelector = 'svg, [hidden], [aria-hidden="true"]';

function findPrimaryTextElement(content: HTMLElement): Element | null {
	const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node != null; node = walker.nextNode()) {
		const element = node.parentElement;
		if (element == null || node.textContent?.trim() === '') continue;
		if (element.closest(ignoredTextSelector) != null) continue;
		if (element.getClientRects().length === 0) continue;
		return element;
	}
	return null;
}
