import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';
import { visuallyHiddenStyle } from '../visually-hidden/recipe.js';

// The custom-property name literal `'--text-line-height'` is repeated below rather than imported
// from `text-line-height.ts` (its shared source of truth; Checkbox's StyleX recipe reads
// `var(--text-line-height, 1lh)` the same way), because StyleX's Babel plugin only resolves a
// computed `stylex.create` key through an imported identifier when that identifier comes from a
// `.stylex.ts` theming module — see the note on `text-line-height.ts`.

const styles = stylex.create({
	base: {
		color: vars.colorTextPrimary,
		fontFamily: vars.fontFamilyBody,
		minInlineSize: 0,
		overflowWrap: 'break-word',
	},

	// ---------------------------------------------------------------------------
	// color
	// ---------------------------------------------------------------------------
	colorAccent: { color: vars.colorForegroundAccentRest },
	colorDanger: { color: vars.colorForegroundDangerRest },
	colorInfo: { color: vars.colorForegroundInfoRest },
	colorPrimary: { color: vars.colorTextPrimary },
	colorSecondary: { color: vars.colorTextSecondary },
	colorSuccess: { color: vars.colorForegroundSuccessRest },
	colorWarning: { color: vars.colorForegroundWarningRest },

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
	fontWeightBody: { fontWeight: vars.fontWeightBody },
	fontWeightEmphasis: { fontWeight: vars.fontWeightEmphasis },
	fontWeightHeading: { fontWeight: vars.fontWeightHeading },
	fontWeightLabel: { fontWeight: vars.fontWeightLabel },

	// ---------------------------------------------------------------------------
	// lineClamp
	// ---------------------------------------------------------------------------
	lineClampFalse: {},
	lineClampMultiLine2: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 2,
		display: '-webkit-box',
		lineClamp: 2,
		minInlineSize: 0,
		overflow: 'hidden',
	},
	lineClampMultiLine3: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 3,
		display: '-webkit-box',
		lineClamp: 3,
		minInlineSize: 0,
		overflow: 'hidden',
	},
	lineClampMultiLine4: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 4,
		display: '-webkit-box',
		lineClamp: 4,
		minInlineSize: 0,
		overflow: 'hidden',
	},
	lineClampMultiLine5: {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 5,
		display: '-webkit-box',
		lineClamp: 5,
		minInlineSize: 0,
		overflow: 'hidden',
	},
	lineClampSingleLine: {
		display: 'block',
		minInlineSize: 0,
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
		'--text-line-height': vars.fontBodyLineHeight,
		fontFamily: vars.fontBodyFontFamily,
		fontSize: vars.fontBodyFontSize,
		letterSpacing: vars.fontBodyLetterSpacing,
		lineHeight: vars.fontBodyLineHeight,
	},
	typographyCaption: {
		'--text-line-height': vars.fontCaptionLineHeight,
		fontFamily: vars.fontCaptionFontFamily,
		fontSize: vars.fontCaptionFontSize,
		letterSpacing: vars.fontCaptionLetterSpacing,
		lineHeight: vars.fontCaptionLineHeight,
	},
	typographyDisplay: {
		'--text-line-height': vars.fontDisplayLineHeight,
		fontFamily: vars.fontDisplayFontFamily,
		fontSize: vars.fontDisplayFontSize,
		letterSpacing: vars.fontDisplayLetterSpacing,
		lineHeight: vars.fontDisplayLineHeight,
	},
	typographyHeading1: {
		'--text-line-height': vars.fontHeading1LineHeight,
		fontFamily: vars.fontHeading1FontFamily,
		fontSize: vars.fontHeading1FontSize,
		letterSpacing: vars.fontHeading1LetterSpacing,
		lineHeight: vars.fontHeading1LineHeight,
	},
	typographyHeading2: {
		'--text-line-height': vars.fontHeading2LineHeight,
		fontFamily: vars.fontHeading2FontFamily,
		fontSize: vars.fontHeading2FontSize,
		letterSpacing: vars.fontHeading2LetterSpacing,
		lineHeight: vars.fontHeading2LineHeight,
	},
	typographyHeading3: {
		'--text-line-height': vars.fontHeading3LineHeight,
		fontFamily: vars.fontHeading3FontFamily,
		fontSize: vars.fontHeading3FontSize,
		letterSpacing: vars.fontHeading3LetterSpacing,
		lineHeight: vars.fontHeading3LineHeight,
	},
	typographyHeading4: {
		'--text-line-height': vars.fontHeading4LineHeight,
		fontFamily: vars.fontHeading4FontFamily,
		fontSize: vars.fontHeading4FontSize,
		letterSpacing: vars.fontHeading4LetterSpacing,
		lineHeight: vars.fontHeading4LineHeight,
	},
	typographyLabel: {
		'--text-line-height': vars.fontLabelLineHeight,
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
	},
	typographyLead: {
		'--text-line-height': vars.fontLeadLineHeight,
		fontFamily: vars.fontLeadFontFamily,
		fontSize: vars.fontLeadFontSize,
		letterSpacing: vars.fontLeadLetterSpacing,
		lineHeight: vars.fontLeadLineHeight,
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
			marginBlockStart: vars.fontBodyBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontBodyCapHeightTrim,
		},
		fontSize: vars.fontBodyFontSize,
		lineHeight: vars.fontBodyLineHeight,
	},
	typographyTrimCaption: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontCaptionBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontCaptionCapHeightTrim,
		},
		fontSize: vars.fontCaptionFontSize,
		lineHeight: vars.fontCaptionLineHeight,
	},
	typographyTrimDisplay: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontDisplayBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontDisplayCapHeightTrim,
		},
		fontSize: vars.fontDisplayFontSize,
		lineHeight: vars.fontDisplayLineHeight,
	},
	typographyTrimHeading1: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontHeading1BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontHeading1CapHeightTrim,
		},
		fontSize: vars.fontHeading1FontSize,
		lineHeight: vars.fontHeading1LineHeight,
	},
	typographyTrimHeading2: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontHeading2BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontHeading2CapHeightTrim,
		},
		fontSize: vars.fontHeading2FontSize,
		lineHeight: vars.fontHeading2LineHeight,
	},
	typographyTrimHeading3: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontHeading3BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontHeading3CapHeightTrim,
		},
		fontSize: vars.fontHeading3FontSize,
		lineHeight: vars.fontHeading3LineHeight,
	},
	typographyTrimHeading4: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontHeading4BaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontHeading4CapHeightTrim,
		},
		fontSize: vars.fontHeading4FontSize,
		lineHeight: vars.fontHeading4LineHeight,
	},
	typographyTrimLabel: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontLabelBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontLabelCapHeightTrim,
		},
		fontSize: vars.fontLabelFontSize,
		lineHeight: vars.fontLabelLineHeight,
	},
	typographyTrimLead: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.fontLeadBaselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.fontLeadCapHeightTrim,
		},
		fontSize: vars.fontLeadFontSize,
		lineHeight: vars.fontLeadLineHeight,
	},
});

/** Public recipe for the `Text` component's styles. */
export const [textRecipe, resolveTextRecipeStyles] = createSingleRecipe({
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
