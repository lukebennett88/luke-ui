import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';
import { visuallyHiddenStyle } from '../visually-hidden/recipe.js';

// The custom-property name literal `'--text-line-height'` is repeated below rather than imported
// from `text-line-height.ts` (its shared source of truth; Checkbox's StyleX recipe reads
// `var(--text-line-height, 1lh)` the same way), because StyleX's Babel plugin only resolves a
// computed `stylex.create` key through an imported identifier when that identifier comes from a
// `.stylex.ts` theming module — see the note on `text-line-height.ts`.

const styles = stylex.create({
	base: {
		color: vars.color.text.primary,
		fontFamily: vars.font.family.body,
		minInlineSize: 0,
		overflowWrap: 'break-word',
	},

	// ---------------------------------------------------------------------------
	// color
	// ---------------------------------------------------------------------------
	colorAccent: { color: vars.color.foreground.accent.rest },
	colorDanger: { color: vars.color.foreground.danger.rest },
	colorInfo: { color: vars.color.foreground.info.rest },
	colorPrimary: { color: vars.color.text.primary },
	colorSecondary: { color: vars.color.text.secondary },
	colorSuccess: { color: vars.color.foreground.success.rest },
	colorWarning: { color: vars.color.foreground.warning.rest },

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
	fontWeightBody: { fontWeight: vars.font.weight.body },
	fontWeightEmphasis: { fontWeight: vars.font.weight.emphasis },
	fontWeightHeading: { fontWeight: vars.font.weight.heading },
	fontWeightLabel: { fontWeight: vars.font.weight.label },

	// ---------------------------------------------------------------------------
	// lineClamp
	// ---------------------------------------------------------------------------
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
	// shouldInheritFont
	// ---------------------------------------------------------------------------
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

	// ---------------------------------------------------------------------------
	// typography
	// ---------------------------------------------------------------------------
	typographyBody: {
		'--text-line-height': vars.font.body.lineHeight,
		fontFamily: vars.font.body.fontFamily,
		fontSize: vars.font.body.fontSize,
		letterSpacing: vars.font.body.letterSpacing,
		lineHeight: vars.font.body.lineHeight,
	},
	typographyCaption: {
		'--text-line-height': vars.font.caption.lineHeight,
		fontFamily: vars.font.caption.fontFamily,
		fontSize: vars.font.caption.fontSize,
		letterSpacing: vars.font.caption.letterSpacing,
		lineHeight: vars.font.caption.lineHeight,
	},
	typographyDisplay: {
		'--text-line-height': vars.font.display.lineHeight,
		fontFamily: vars.font.display.fontFamily,
		fontSize: vars.font.display.fontSize,
		letterSpacing: vars.font.display.letterSpacing,
		lineHeight: vars.font.display.lineHeight,
	},
	typographyHeading1: {
		'--text-line-height': vars.font.heading1.lineHeight,
		fontFamily: vars.font.heading1.fontFamily,
		fontSize: vars.font.heading1.fontSize,
		letterSpacing: vars.font.heading1.letterSpacing,
		lineHeight: vars.font.heading1.lineHeight,
	},
	typographyHeading2: {
		'--text-line-height': vars.font.heading2.lineHeight,
		fontFamily: vars.font.heading2.fontFamily,
		fontSize: vars.font.heading2.fontSize,
		letterSpacing: vars.font.heading2.letterSpacing,
		lineHeight: vars.font.heading2.lineHeight,
	},
	typographyHeading3: {
		'--text-line-height': vars.font.heading3.lineHeight,
		fontFamily: vars.font.heading3.fontFamily,
		fontSize: vars.font.heading3.fontSize,
		letterSpacing: vars.font.heading3.letterSpacing,
		lineHeight: vars.font.heading3.lineHeight,
	},
	typographyHeading4: {
		'--text-line-height': vars.font.heading4.lineHeight,
		fontFamily: vars.font.heading4.fontFamily,
		fontSize: vars.font.heading4.fontSize,
		letterSpacing: vars.font.heading4.letterSpacing,
		lineHeight: vars.font.heading4.lineHeight,
	},
	typographyLabel: {
		'--text-line-height': vars.font.label.lineHeight,
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
	},
	typographyLead: {
		'--text-line-height': vars.font.lead.lineHeight,
		fontFamily: vars.font.lead.fontFamily,
		fontSize: vars.font.lead.fontSize,
		letterSpacing: vars.font.lead.letterSpacing,
		lineHeight: vars.font.lead.lineHeight,
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
			marginBlockStart: vars.font.body.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.body.capHeightTrim,
		},
		fontSize: vars.font.body.fontSize,
		lineHeight: vars.font.body.lineHeight,
	},
	typographyTrimCaption: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.caption.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.caption.capHeightTrim,
		},
		fontSize: vars.font.caption.fontSize,
		lineHeight: vars.font.caption.lineHeight,
	},
	typographyTrimDisplay: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.display.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.display.capHeightTrim,
		},
		fontSize: vars.font.display.fontSize,
		lineHeight: vars.font.display.lineHeight,
	},
	typographyTrimHeading1: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.heading1.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.heading1.capHeightTrim,
		},
		fontSize: vars.font.heading1.fontSize,
		lineHeight: vars.font.heading1.lineHeight,
	},
	typographyTrimHeading2: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.heading2.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.heading2.capHeightTrim,
		},
		fontSize: vars.font.heading2.fontSize,
		lineHeight: vars.font.heading2.lineHeight,
	},
	typographyTrimHeading3: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.heading3.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.heading3.capHeightTrim,
		},
		fontSize: vars.font.heading3.fontSize,
		lineHeight: vars.font.heading3.lineHeight,
	},
	typographyTrimHeading4: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.heading4.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.heading4.capHeightTrim,
		},
		fontSize: vars.font.heading4.fontSize,
		lineHeight: vars.font.heading4.lineHeight,
	},
	typographyTrimLabel: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.label.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.label.capHeightTrim,
		},
		fontSize: vars.font.label.fontSize,
		lineHeight: vars.font.label.lineHeight,
	},
	typographyTrimLead: {
		'::after': {
			content: "''",
			display: 'table',
			marginBlockStart: vars.font.lead.baselineTrim,
		},
		'::before': {
			content: "''",
			display: 'table',
			marginBlockEnd: vars.font.lead.capHeightTrim,
		},
		fontSize: vars.font.lead.fontSize,
		lineHeight: vars.font.lead.lineHeight,
	},
});

/** Canonical resolver for the `Text` component's styles. */
export const resolveTextRecipeStyles = createRecipeStyles({
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
			false: null,
			true: visuallyHiddenStyle,
		},
		lineClamp: {
			1: styles.lineClampSingleLine,
			2: styles.lineClampMultiLine2,
			3: styles.lineClampMultiLine3,
			4: styles.lineClampMultiLine4,
			5: styles.lineClampMultiLine5,
			false: null,
			true: styles.lineClampSingleLine,
		},
		shouldDisableTrim: {
			false: null,
			true: null,
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
			unset: null,
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
			false: null,
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

/** Public recipe for the `Text` component's styles. */
export const textRecipe = createRecipe(resolveTextRecipeStyles);

/** Aggregate variant type for the `Text` recipe. */
export type TextRecipeVariants = RecipeSelection<typeof resolveTextRecipeStyles>;
