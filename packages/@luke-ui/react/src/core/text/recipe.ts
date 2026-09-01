import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';
import { visuallyHiddenStyle } from '../visually-hidden/recipe.js';

// The custom-property name literal `'--text-line-height'` is repeated below rather than imported
// from `text-line-height.ts` (its shared source of truth, consumed directly by
// `primitives/checkbox/recipe.css.ts`), because StyleX's Babel plugin only resolves a computed
// `stylex.create` key through an imported identifier when that identifier comes from a
// `.stylex.ts` theming module — see the note on `text-line-height.ts`.

const styles = stylex.create({
	base: {
		color: tokens.colorTextPrimary,
		fontFamily: tokens.fontFamilyBody,
		'min-inline-size': 0,
		overflowWrap: 'break-word',
	},

	// ---------------------------------------------------------------------------
	// color
	// ---------------------------------------------------------------------------
	colorAccent: { color: tokens.colorForegroundAccentRest },
	colorDanger: { color: tokens.colorForegroundDangerRest },
	colorInfo: { color: tokens.colorForegroundInfoRest },
	colorPrimary: { color: tokens.colorTextPrimary },
	colorSecondary: { color: tokens.colorTextSecondary },
	colorSuccess: { color: tokens.colorForegroundSuccessRest },
	colorWarning: { color: tokens.colorForegroundWarningRest },

	// ---------------------------------------------------------------------------
	// fontVariantNumeric
	// ---------------------------------------------------------------------------
	fontVariantNumericDiagonalFractions: { fontVariantNumeric: 'diagonal-fractions' },
	fontVariantNumericOrdinal: { fontVariantNumeric: 'ordinal' },
	fontVariantNumericSlashedZero: { fontVariantNumeric: 'slashed-zero' },
	fontVariantNumericTabularNums: { fontVariantNumeric: 'tabular-nums' },
	fontVariantNumericUnset: { fontVariantNumeric: 'normal' },

	// ---------------------------------------------------------------------------
	// fontWeight
	// ---------------------------------------------------------------------------
	fontWeightBody: { fontWeight: tokens.fontWeightBody },
	fontWeightEmphasis: { fontWeight: tokens.fontWeightEmphasis },
	fontWeightHeading: { fontWeight: tokens.fontWeightHeading },
	fontWeightLabel: { fontWeight: tokens.fontWeightLabel },

	// ---------------------------------------------------------------------------
	// lineClamp
	// ---------------------------------------------------------------------------
	lineClampFalse: {},
	lineClampMultiLine2: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 2,
		display: '-webkit-box',
		lineClamp: 2,
		'min-inline-size': 0,
		overflow: 'hidden',
	},
	lineClampMultiLine3: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 3,
		display: '-webkit-box',
		lineClamp: 3,
		'min-inline-size': 0,
		overflow: 'hidden',
	},
	lineClampMultiLine4: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 4,
		display: '-webkit-box',
		lineClamp: 4,
		'min-inline-size': 0,
		overflow: 'hidden',
	},
	lineClampMultiLine5: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 5,
		display: '-webkit-box',
		lineClamp: 5,
		'min-inline-size': 0,
		overflow: 'hidden',
	},
	lineClampSingleLine: {
		display: 'block',
		'min-inline-size': 0,
		overflowX: 'clip',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},

	// ---------------------------------------------------------------------------
	// shouldDisableTrim (no styling of its own — see the typography compound variants below)
	// ---------------------------------------------------------------------------
	shouldDisableTrimFalse: {},
	shouldDisableTrimTrue: {},

	// ---------------------------------------------------------------------------
	// shouldInheritFont
	// ---------------------------------------------------------------------------
	shouldInheritFontFalse: {},
	shouldInheritFontTrue: {
		'--text-line-height': '1lh',
		color: 'inherit',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontStyle: 'inherit',
		fontWeight: 'inherit',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
	},

	// ---------------------------------------------------------------------------
	// textAlign
	// ---------------------------------------------------------------------------
	textAlignCenter: { textAlign: 'center' },
	textAlignEnd: { textAlign: 'end' },
	textAlignStart: { textAlign: 'start' },

	// ---------------------------------------------------------------------------
	// textDecoration
	// ---------------------------------------------------------------------------
	textDecorationInherit: { textDecoration: 'inherit' },
	textDecorationLineThrough: { textDecoration: 'line-through' },
	textDecorationNone: { textDecoration: 'none' },
	textDecorationUnderline: { textDecoration: 'underline' },

	// ---------------------------------------------------------------------------
	// textTransform
	// ---------------------------------------------------------------------------
	textTransformCapitalize: { textTransform: 'capitalize' },
	textTransformInherit: { textTransform: 'inherit' },
	textTransformLowercase: { textTransform: 'lowercase' },
	textTransformNone: { textTransform: 'none' },
	textTransformUppercase: { textTransform: 'uppercase' },

	// ---------------------------------------------------------------------------
	// textWrap
	// ---------------------------------------------------------------------------
	textWrapBalance: { textWrap: 'balance' },
	textWrapPretty: { textWrap: 'pretty' },
	textWrapUnset: {},

	// ---------------------------------------------------------------------------
	// typography
	// ---------------------------------------------------------------------------
	typographyBody: {
		'--text-line-height': tokens.fontBodyLineHeight,
		fontFamily: tokens.fontBodyFontFamily,
		fontSize: tokens.fontBodyFontSize,
		letterSpacing: tokens.fontBodyLetterSpacing,
		lineHeight: tokens.fontBodyLineHeight,
	},
	typographyCaption: {
		'--text-line-height': tokens.fontCaptionLineHeight,
		fontFamily: tokens.fontCaptionFontFamily,
		fontSize: tokens.fontCaptionFontSize,
		letterSpacing: tokens.fontCaptionLetterSpacing,
		lineHeight: tokens.fontCaptionLineHeight,
	},
	typographyDisplay: {
		'--text-line-height': tokens.fontDisplayLineHeight,
		fontFamily: tokens.fontDisplayFontFamily,
		fontSize: tokens.fontDisplayFontSize,
		letterSpacing: tokens.fontDisplayLetterSpacing,
		lineHeight: tokens.fontDisplayLineHeight,
	},
	typographyHeading1: {
		'--text-line-height': tokens.fontHeading1LineHeight,
		fontFamily: tokens.fontHeading1FontFamily,
		fontSize: tokens.fontHeading1FontSize,
		letterSpacing: tokens.fontHeading1LetterSpacing,
		lineHeight: tokens.fontHeading1LineHeight,
	},
	typographyHeading2: {
		'--text-line-height': tokens.fontHeading2LineHeight,
		fontFamily: tokens.fontHeading2FontFamily,
		fontSize: tokens.fontHeading2FontSize,
		letterSpacing: tokens.fontHeading2LetterSpacing,
		lineHeight: tokens.fontHeading2LineHeight,
	},
	typographyHeading3: {
		'--text-line-height': tokens.fontHeading3LineHeight,
		fontFamily: tokens.fontHeading3FontFamily,
		fontSize: tokens.fontHeading3FontSize,
		letterSpacing: tokens.fontHeading3LetterSpacing,
		lineHeight: tokens.fontHeading3LineHeight,
	},
	typographyHeading4: {
		'--text-line-height': tokens.fontHeading4LineHeight,
		fontFamily: tokens.fontHeading4FontFamily,
		fontSize: tokens.fontHeading4FontSize,
		letterSpacing: tokens.fontHeading4LetterSpacing,
		lineHeight: tokens.fontHeading4LineHeight,
	},
	typographyLabel: {
		'--text-line-height': tokens.fontLabelLineHeight,
		fontFamily: tokens.fontLabelFontFamily,
		fontSize: tokens.fontLabelFontSize,
		letterSpacing: tokens.fontLabelLetterSpacing,
		lineHeight: tokens.fontLabelLineHeight,
	},
	typographyLead: {
		'--text-line-height': tokens.fontLeadLineHeight,
		fontFamily: tokens.fontLeadFontFamily,
		fontSize: tokens.fontLeadFontSize,
		letterSpacing: tokens.fontLeadLetterSpacing,
		lineHeight: tokens.fontLeadLineHeight,
	},

	// ---------------------------------------------------------------------------
	// typography trim compound variants
	//
	// Each compound carries one typography style's Capsize trim, applied via `::before`/`::after`
	// pseudo-elements. `stylex.props` applies styles last-wins per property, and `recipe()` resolves
	// compound variants after simple variants (see `stylex-recipe.ts`), so a compound here always
	// wins over the plain `typography` variant it shares a selection with — the mechanism that
	// gives `shouldInheritFont: true` priority over a trim compound is `recipe()`'s compound-vs-plain
	// ordering, not source order within this `stylex.create` call.
	// ---------------------------------------------------------------------------
	typographyTrimBody: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontBodyBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontBodyCapHeightTrim,
		},
		fontSize: tokens.fontBodyFontSize,
		lineHeight: tokens.fontBodyLineHeight,
	},
	typographyTrimCaption: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontCaptionBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontCaptionCapHeightTrim,
		},
		fontSize: tokens.fontCaptionFontSize,
		lineHeight: tokens.fontCaptionLineHeight,
	},
	typographyTrimDisplay: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontDisplayBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontDisplayCapHeightTrim,
		},
		fontSize: tokens.fontDisplayFontSize,
		lineHeight: tokens.fontDisplayLineHeight,
	},
	typographyTrimHeading1: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontHeading1BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontHeading1CapHeightTrim,
		},
		fontSize: tokens.fontHeading1FontSize,
		lineHeight: tokens.fontHeading1LineHeight,
	},
	typographyTrimHeading2: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontHeading2BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontHeading2CapHeightTrim,
		},
		fontSize: tokens.fontHeading2FontSize,
		lineHeight: tokens.fontHeading2LineHeight,
	},
	typographyTrimHeading3: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontHeading3BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontHeading3CapHeightTrim,
		},
		fontSize: tokens.fontHeading3FontSize,
		lineHeight: tokens.fontHeading3LineHeight,
	},
	typographyTrimHeading4: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontHeading4BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontHeading4CapHeightTrim,
		},
		fontSize: tokens.fontHeading4FontSize,
		lineHeight: tokens.fontHeading4LineHeight,
	},
	typographyTrimLabel: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontLabelBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontLabelCapHeightTrim,
		},
		fontSize: tokens.fontLabelFontSize,
		lineHeight: tokens.fontLabelLineHeight,
	},
	typographyTrimLead: {
		'::after': {
			content: "''",
			display: 'table',
			'margin-block-start': tokens.fontLeadBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			'margin-block-end': tokens.fontLeadCapHeightTrim,
		},
		fontSize: tokens.fontLeadFontSize,
		lineHeight: tokens.fontLeadLineHeight,
	},
});

/** Public recipe for the `Text` component's styles. */
export const { recipe: textRecipe, resolveStyles: resolveTextRecipeStyles } = createSingleRecipe({
	base: styles.base,
	compoundVariants: [
		// `shouldInheritFont: true` asks the browser to resolve font size and line height from the
		// surrounding context, not this style's Capsize metrics — so a trim compound only applies
		// when both `shouldDisableTrim` and `shouldInheritFont` are false for the matching typography.
		{
			style: styles.typographyTrimBody,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'body' },
		},
		{
			style: styles.typographyTrimCaption,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'caption' },
		},
		{
			style: styles.typographyTrimDisplay,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'display' },
		},
		{
			style: styles.typographyTrimHeading1,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'heading1' },
		},
		{
			style: styles.typographyTrimHeading2,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'heading2' },
		},
		{
			style: styles.typographyTrimHeading3,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'heading3' },
		},
		{
			style: styles.typographyTrimHeading4,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'heading4' },
		},
		{
			style: styles.typographyTrimLabel,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'label' },
		},
		{
			style: styles.typographyTrimLead,
			variants: { shouldDisableTrim: false, shouldInheritFont: false, typography: 'lead' },
		},
	],
	defaultVariants: {
		fontVariantNumeric: 'unset',
		isVisuallyHidden: false,
		lineClamp: false,
		shouldDisableTrim: false,
		shouldInheritFont: false,
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'unset',
		typography: 'body',
	},
	// Variant group order is significant: `resolveStyles` (`stylex-recipe.ts`) applies simple
	// variant groups in this object's key order, last-wins per property, mirroring the Vanilla
	// Extract engine's "config order" contract. `typography` must precede `fontWeight` and
	// `shouldInheritFont` so `shouldInheritFont: true`'s `inherit` values win over the selected
	// typography's own `fontFamily`/`fontSize`/`letterSpacing`/`lineHeight`/`fontWeight` — this
	// order is the one place that precedence is decided, not the trim compound variants above.
	variants: {
		fontVariantNumeric: {
			'diagonal-fractions': styles.fontVariantNumericDiagonalFractions,
			ordinal: styles.fontVariantNumericOrdinal,
			'slashed-zero': styles.fontVariantNumericSlashedZero,
			'tabular-nums': styles.fontVariantNumericTabularNums,
			unset: styles.fontVariantNumericUnset,
		},
		isVisuallyHidden: {
			false: {},
			true: visuallyHiddenStyle,
		},
		lineClamp: {
			1: styles.lineClampSingleLine,
			2: styles.lineClampMultiLine2,
			3: styles.lineClampMultiLine3,
			4: styles.lineClampMultiLine4,
			5: styles.lineClampMultiLine5,
			false: styles.lineClampFalse,
			true: styles.lineClampSingleLine,
		},
		shouldDisableTrim: {
			false: styles.shouldDisableTrimFalse,
			true: styles.shouldDisableTrimTrue,
		},
		textAlign: {
			center: styles.textAlignCenter,
			end: styles.textAlignEnd,
			start: styles.textAlignStart,
		},
		textDecoration: {
			inherit: styles.textDecorationInherit,
			'line-through': styles.textDecorationLineThrough,
			none: styles.textDecorationNone,
			underline: styles.textDecorationUnderline,
		},
		textTransform: {
			capitalize: styles.textTransformCapitalize,
			inherit: styles.textTransformInherit,
			lowercase: styles.textTransformLowercase,
			none: styles.textTransformNone,
			uppercase: styles.textTransformUppercase,
		},
		textWrap: {
			balance: styles.textWrapBalance,
			pretty: styles.textWrapPretty,
			unset: styles.textWrapUnset,
		},
		typography: {
			body: styles.typographyBody,
			caption: styles.typographyCaption,
			display: styles.typographyDisplay,
			heading1: styles.typographyHeading1,
			heading2: styles.typographyHeading2,
			heading3: styles.typographyHeading3,
			heading4: styles.typographyHeading4,
			label: styles.typographyLabel,
			lead: styles.typographyLead,
		},
		fontWeight: {
			body: styles.fontWeightBody,
			emphasis: styles.fontWeightEmphasis,
			heading: styles.fontWeightHeading,
			label: styles.fontWeightLabel,
		},
		shouldInheritFont: {
			false: styles.shouldInheritFontFalse,
			true: styles.shouldInheritFontTrue,
		},
		color: {
			accent: styles.colorAccent,
			danger: styles.colorDanger,
			info: styles.colorInfo,
			primary: styles.colorPrimary,
			secondary: styles.colorSecondary,
			success: styles.colorSuccess,
			warning: styles.colorWarning,
		},
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextRecipeVariants = RecipeSelection<typeof textRecipe>;
