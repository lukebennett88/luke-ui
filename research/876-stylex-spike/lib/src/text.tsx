import * as stylex from '@stylexjs/stylex';
import type { CSSProperties, JSX, ReactNode, Ref } from 'react';
import { Text as RacText } from 'react-aria-components/Text';
import { styleProps } from './merge.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';
import type { trims } from './tokens.stylex.js';
import { vars } from './tokens.stylex.js';

// `contextualForeground()` in the Vanilla Extract build. StyleX cannot import that helper from
// another module, so each file that needs the fallback chain repeats it.
const foreground = {
	primary: `var(--luke-internal-foreground-primary, ${vars.color.foreground.primary})`,
	secondary: `var(--luke-internal-foreground-secondary, ${vars.color.foreground.secondary})`,
	role: (role: 'accent' | 'danger' | 'info' | 'neutral' | 'success' | 'warning') =>
		`var(--luke-internal-foreground-tone, var(--luke-color-foreground-${role}-rest))`,
};

// StyleX evaluates only expression-bodied arrow functions declared in the same file.
const typography = (style: keyof typeof trims) => ({
	fontFamily: `var(--luke-font-${style}-font-family)`,
	fontSize: `var(--luke-font-${style}-font-size)`,
	letterSpacing: `var(--luke-font-${style}-letter-spacing)`,
	lineHeight: `var(--luke-font-${style}-line-height)`,
});

// The Capsize trim boxes. `flow-root`, not `table`: Chromium takes a block's first baseline from an
// empty `display: table` pseudo-element.
// StyleX cannot index an imported constant group with a parameter, so the helper rebuilds the
// variable names as strings and loses the generated types.
const trim = (style: keyof typeof trims) => ({
	'::before': {
		content: "''",
		display: 'flow-root',
		marginBlockEnd: `var(--luke-internal-font-${style}-cap-height-trim)`,
	},
	'::after': {
		content: "''",
		display: 'flow-root',
		marginBlockStart: `var(--luke-internal-font-${style}-baseline-trim)`,
	},
});

const singleLine = {
	display: 'block',
	minInlineSize: 0,
	overflowX: 'clip',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} as const;
const multiLine = (lines: number) =>
	({
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: lines,
		display: '-webkit-box',
		lineClamp: lines,
		minInlineSize: 0,
		overflow: 'hidden',
	}) as const;

const styles = stylex.create({
	base: {
		fontFamily: vars.font.family.body,
		fontVariantNumeric: 'normal',
		// A zero-specificity reset in the Vanilla Extract build. Every StyleX atom has class
		// specificity, so Prose would need to win by layer or specificity instead.
		margin: 0,
		minInlineSize: 0,
		overflowWrap: 'break-word',
		textTransform: 'none',
	},
	caption: typography('caption'),
	label: typography('label'),
	body: typography('body'),
	lead: typography('lead'),
	heading4: typography('heading4'),
	heading3: typography('heading3'),
	heading2: typography('heading2'),
	heading1: typography('heading1'),
	display: typography('display'),
	trimCaption: trim('caption'),
	trimLabel: trim('label'),
	trimBody: trim('body'),
	trimLead: trim('lead'),
	trimHeading4: trim('heading4'),
	trimHeading3: trim('heading3'),
	trimHeading2: trim('heading2'),
	trimHeading1: trim('heading1'),
	trimDisplay: trim('display'),
	inheritFont: {
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontStyle: 'inherit',
		fontVariantNumeric: 'inherit',
		fontWeight: 'inherit',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		textTransform: 'inherit',
	},
	wrapBalance: { textWrap: 'balance' },
	wrapPretty: { textWrap: 'pretty' },
	clamp1: singleLine,
	clamp2: multiLine(2),
	clamp3: multiLine(3),
	clamp4: multiLine(4),
	clamp5: multiLine(5),
	alignStart: { textAlign: 'start' },
	alignCenter: { textAlign: 'center' },
	alignEnd: { textAlign: 'end' },
	decorationInherit: { textDecoration: 'inherit' },
	decorationLineThrough: { textDecoration: 'line-through' },
	decorationNone: { textDecoration: 'none' },
	decorationUnderline: { textDecoration: 'underline' },
	weightBody: { fontWeight: vars.font.weight.body },
	weightEmphasis: { fontWeight: vars.font.weight.emphasis },
	weightHeading: { fontWeight: vars.font.weight.heading },
	weightLabel: { fontWeight: vars.font.weight.label },
	styleInherit: { fontStyle: 'inherit' },
	styleItalic: { fontStyle: 'italic' },
	styleNormal: { fontStyle: 'normal' },
	numericDiagonal: { fontVariantNumeric: 'diagonal-fractions' },
	numericNormal: { fontVariantNumeric: 'normal' },
	numericOrdinal: { fontVariantNumeric: 'ordinal' },
	numericSlashed: { fontVariantNumeric: 'slashed-zero' },
	numericTabular: { fontVariantNumeric: 'tabular-nums' },
	transformCapitalize: { textTransform: 'capitalize' },
	transformInherit: { textTransform: 'inherit' },
	transformLowercase: { textTransform: 'lowercase' },
	transformNone: { textTransform: 'none' },
	transformUppercase: { textTransform: 'uppercase' },
	accent: { color: foreground.role('accent') },
	danger: { color: foreground.role('danger') },
	info: { color: foreground.role('info') },
	neutral: { color: foreground.role('neutral') },
	primary: { color: foreground.primary },
	secondary: { color: foreground.secondary },
	success: { color: foreground.role('success') },
	warning: { color: foreground.role('warning') },
});

/**
 * StyleX resolves a property that several groups set by application order, so the group order below
 * is the precedence order. `shouldInheritFont` follows `typography` and needs no compound to beat it.
 */
export const textRecipe = recipe({
	base: styles.base,
	defaultVariants: {
		color: 'none',
		fontStyle: 'default',
		fontVariantNumeric: 'default',
		fontWeight: 'none',
		lineClamp: 'false',
		shouldDisableTrim: 'false',
		shouldInheritFont: 'false',
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'default',
		textWrap: 'default',
		typography: 'body',
	},
	variants: {
		typography: {
			body: styles.body,
			caption: styles.caption,
			display: styles.display,
			heading1: styles.heading1,
			heading2: styles.heading2,
			heading3: styles.heading3,
			heading4: styles.heading4,
			label: styles.label,
			lead: styles.lead,
		},
		textWrap: { balance: styles.wrapBalance, default: null, pretty: styles.wrapPretty },
		lineClamp: {
			'1': styles.clamp1,
			'2': styles.clamp2,
			'3': styles.clamp3,
			'4': styles.clamp4,
			'5': styles.clamp5,
			false: null,
			true: styles.clamp1,
		},
		shouldDisableTrim: { false: null, true: null },
		textAlign: {
			center: styles.alignCenter,
			end: styles.alignEnd,
			start: styles.alignStart,
		},
		textDecoration: {
			inherit: styles.decorationInherit,
			'line-through': styles.decorationLineThrough,
			none: styles.decorationNone,
			underline: styles.decorationUnderline,
		},
		shouldInheritFont: { false: null, true: styles.inheritFont },
		fontWeight: {
			body: styles.weightBody,
			emphasis: styles.weightEmphasis,
			heading: styles.weightHeading,
			label: styles.weightLabel,
			none: null,
		},
		fontStyle: {
			default: null,
			inherit: styles.styleInherit,
			italic: styles.styleItalic,
			normal: styles.styleNormal,
		},
		fontVariantNumeric: {
			default: null,
			'diagonal-fractions': styles.numericDiagonal,
			normal: styles.numericNormal,
			ordinal: styles.numericOrdinal,
			'slashed-zero': styles.numericSlashed,
			'tabular-nums': styles.numericTabular,
		},
		textTransform: {
			capitalize: styles.transformCapitalize,
			default: null,
			inherit: styles.transformInherit,
			lowercase: styles.transformLowercase,
			none: styles.transformNone,
			uppercase: styles.transformUppercase,
		},
		color: {
			accent: styles.accent,
			danger: styles.danger,
			info: styles.info,
			neutral: styles.neutral,
			none: null,
			primary: styles.primary,
			secondary: styles.secondary,
			success: styles.success,
			warning: styles.warning,
		},
	},
	compoundVariants: (
		[
			['body', styles.trimBody],
			['caption', styles.trimCaption],
			['display', styles.trimDisplay],
			['heading1', styles.trimHeading1],
			['heading2', styles.trimHeading2],
			['heading3', styles.trimHeading3],
			['heading4', styles.trimHeading4],
			['label', styles.trimLabel],
			['lead', styles.trimLead],
		] as const
	).map(([typeStyle, style]) => {
		return {
			style,
			variants: { shouldDisableTrim: 'false', shouldInheritFont: 'false', typography: typeStyle },
		} as const;
	}),
});

type TextSelection = RecipeSelection<typeof textRecipe>;
type TypeStyle = NonNullable<TextSelection['typography']>;

const weightRole = {
	body: 'body',
	caption: 'body',
	display: 'heading',
	heading1: 'heading',
	heading2: 'heading',
	heading3: 'heading',
	heading4: 'heading',
	label: 'label',
	lead: 'body',
} as const satisfies Record<TypeStyle, NonNullable<TextSelection['fontWeight']>>;

const blockElements = new Set([
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

/** Props for `Text`. */
export interface TextProps {
	children?: ReactNode;
	className?: string;
	color?: Exclude<TextSelection['color'], 'none'>;
	elementType?: string;
	fontStyle?: TextSelection['fontStyle'];
	fontVariantNumeric?: TextSelection['fontVariantNumeric'];
	fontWeight?: Exclude<TextSelection['fontWeight'], 'none'>;
	id?: string;
	lineClamp?: boolean | 1 | 2 | 3 | 4 | 5;
	ref?: Ref<HTMLElement>;
	shouldDisableTrim?: boolean;
	shouldInheritFont?: boolean;
	slot?: string;
	style?: CSSProperties;
	textAlign?: TextSelection['textAlign'];
	textDecoration?: TextSelection['textDecoration'];
	textTransform?: TextSelection['textTransform'];
	textWrap?: TextSelection['textWrap'];
	typography?: TypeStyle;
}

/** Typography primitive. Mirrors the props of the Vanilla Extract `Text` used by the benchmark apps. */
export function Text(props: TextProps): JSX.Element {
	const {
		children,
		className,
		color,
		elementType = 'span',
		fontStyle,
		fontVariantNumeric,
		fontWeight,
		lineClamp,
		ref,
		shouldDisableTrim,
		shouldInheritFont,
		style,
		textAlign,
		textDecoration,
		textTransform,
		textWrap,
		typography: typeStyle = 'body',
		...rest
	} = props;
	const hasLineClamp = lineClamp !== undefined && lineClamp !== false;
	const disableTrim = hasLineClamp || (shouldDisableTrim ?? !blockElements.has(elementType));
	const resolved = styleProps(
		textRecipe({
			color,
			fontStyle,
			fontVariantNumeric,
			fontWeight: fontWeight ?? (shouldInheritFont ? undefined : weightRole[typeStyle]),
			lineClamp,
			shouldDisableTrim: disableTrim,
			shouldInheritFont: shouldInheritFont ?? false,
			textAlign,
			textDecoration,
			textTransform,
			textWrap,
			typography: typeStyle,
		}),
		className,
		style,
	);
	return (
		<RacText {...rest} {...resolved} elementType={elementType} ref={ref}>
			{children}
		</RacText>
	);
}
