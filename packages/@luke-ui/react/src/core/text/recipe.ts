import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { compiledStyle, recipe } from '../styles/recipe-authoring.js';
import { visuallyHiddenStyle } from '../visually-hidden/recipe.js';

// The custom-property name literal `'--text-line-height'` is repeated below rather than imported
// from `text-line-height.ts` (its shared source of truth; Checkbox's StyleX recipe reads
// `var(--text-line-height, 1lh)` the same way), because StyleX's Babel plugin only resolves a
// computed `stylex.create` key through an imported identifier when that identifier comes from a
// `.stylex.ts` theming module — see the note on `text-line-height.ts`.

/** Recipe for the `Text` component's styles. */
export const textRecipe = recipe({
	base: {
		color: vars.color.text.primary,
		fontFamily: vars.font.family.body,
		minInlineSize: 0,
		overflowWrap: 'break-word',
	},
	// Each compound carries one typography style's Capsize trim, applied via `::before`/`::after`
	// pseudo-elements. `shouldInheritFont: true` asks the browser to resolve font size and line
	// height from the surrounding context, not this style's Capsize metrics — so a trim compound
	// only applies when both `shouldDisableTrim` and `shouldInheritFont` are false for the matching
	// typography.
	compoundVariants: [
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'body',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'caption',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'display',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'heading1',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'heading2',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'heading3',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'heading4',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'label',
		},
		{
			shouldDisableTrim: false,
			shouldInheritFont: false,
			style: {
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
			typography: 'lead',
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
	// Variant group order is significant: the runtime applies variant groups in this object's key
	// order, last-wins per property. `typography` must precede `fontWeight` and `shouldInheritFont`
	// so `shouldInheritFont: true`'s `inherit` values win over the selected typography's own
	// `fontFamily`/`fontSize`/`letterSpacing`/`lineHeight`/`fontWeight`.
	variants: {
		fontVariantNumeric: {
			'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
			ordinal: { fontVariantNumeric: 'ordinal' },
			'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
			'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
			unset: { fontVariantNumeric: 'normal' },
		},
		isVisuallyHidden: {
			false: null,
			true: compiledStyle(visuallyHiddenStyle),
		},
		lineClamp: {
			1: {
				display: 'block',
				minInlineSize: 0,
				overflowX: 'clip',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
			},
			2: {
				WebkitBoxOrient: 'vertical',
				WebkitLineClamp: 2,
				display: '-webkit-box',
				lineClamp: 2,
				minInlineSize: 0,
				overflow: 'hidden',
			},
			3: {
				WebkitBoxOrient: 'vertical',
				WebkitLineClamp: 3,
				display: '-webkit-box',
				lineClamp: 3,
				minInlineSize: 0,
				overflow: 'hidden',
			},
			4: {
				WebkitBoxOrient: 'vertical',
				WebkitLineClamp: 4,
				display: '-webkit-box',
				lineClamp: 4,
				minInlineSize: 0,
				overflow: 'hidden',
			},
			5: {
				WebkitBoxOrient: 'vertical',
				WebkitLineClamp: 5,
				display: '-webkit-box',
				lineClamp: 5,
				minInlineSize: 0,
				overflow: 'hidden',
			},
			false: null,
			true: {
				display: 'block',
				minInlineSize: 0,
				overflowX: 'clip',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
			},
		},
		shouldDisableTrim: {
			false: null,
			true: null,
		},
		textAlign: {
			center: { textAlign: 'center' },
			end: { textAlign: 'end' },
			start: { textAlign: 'start' },
		},
		textDecoration: {
			inherit: { textDecoration: 'inherit' },
			'line-through': { textDecoration: 'line-through' },
			none: { textDecoration: 'none' },
			underline: { textDecoration: 'underline' },
		},
		textTransform: {
			capitalize: { textTransform: 'capitalize' },
			inherit: { textTransform: 'inherit' },
			lowercase: { textTransform: 'lowercase' },
			none: { textTransform: 'none' },
			uppercase: { textTransform: 'uppercase' },
		},
		textWrap: {
			balance: { textWrap: 'balance' },
			pretty: { textWrap: 'pretty' },
			unset: null,
		},
		typography: {
			body: {
				'--text-line-height': vars.font.body.lineHeight,
				fontFamily: vars.font.body.fontFamily,
				fontSize: vars.font.body.fontSize,
				letterSpacing: vars.font.body.letterSpacing,
				lineHeight: vars.font.body.lineHeight,
			},
			caption: {
				'--text-line-height': vars.font.caption.lineHeight,
				fontFamily: vars.font.caption.fontFamily,
				fontSize: vars.font.caption.fontSize,
				letterSpacing: vars.font.caption.letterSpacing,
				lineHeight: vars.font.caption.lineHeight,
			},
			display: {
				'--text-line-height': vars.font.display.lineHeight,
				fontFamily: vars.font.display.fontFamily,
				fontSize: vars.font.display.fontSize,
				letterSpacing: vars.font.display.letterSpacing,
				lineHeight: vars.font.display.lineHeight,
			},
			heading1: {
				'--text-line-height': vars.font.heading1.lineHeight,
				fontFamily: vars.font.heading1.fontFamily,
				fontSize: vars.font.heading1.fontSize,
				letterSpacing: vars.font.heading1.letterSpacing,
				lineHeight: vars.font.heading1.lineHeight,
			},
			heading2: {
				'--text-line-height': vars.font.heading2.lineHeight,
				fontFamily: vars.font.heading2.fontFamily,
				fontSize: vars.font.heading2.fontSize,
				letterSpacing: vars.font.heading2.letterSpacing,
				lineHeight: vars.font.heading2.lineHeight,
			},
			heading3: {
				'--text-line-height': vars.font.heading3.lineHeight,
				fontFamily: vars.font.heading3.fontFamily,
				fontSize: vars.font.heading3.fontSize,
				letterSpacing: vars.font.heading3.letterSpacing,
				lineHeight: vars.font.heading3.lineHeight,
			},
			heading4: {
				'--text-line-height': vars.font.heading4.lineHeight,
				fontFamily: vars.font.heading4.fontFamily,
				fontSize: vars.font.heading4.fontSize,
				letterSpacing: vars.font.heading4.letterSpacing,
				lineHeight: vars.font.heading4.lineHeight,
			},
			label: {
				'--text-line-height': vars.font.label.lineHeight,
				fontFamily: vars.font.label.fontFamily,
				fontSize: vars.font.label.fontSize,
				letterSpacing: vars.font.label.letterSpacing,
				lineHeight: vars.font.label.lineHeight,
			},
			lead: {
				'--text-line-height': vars.font.lead.lineHeight,
				fontFamily: vars.font.lead.fontFamily,
				fontSize: vars.font.lead.fontSize,
				letterSpacing: vars.font.lead.letterSpacing,
				lineHeight: vars.font.lead.lineHeight,
			},
		},
		fontWeight: {
			body: { fontWeight: vars.font.weight.body },
			emphasis: { fontWeight: vars.font.weight.emphasis },
			heading: { fontWeight: vars.font.weight.heading },
			label: { fontWeight: vars.font.weight.label },
		},
		shouldInheritFont: {
			false: null,
			true: {
				'--text-line-height': '1lh',
				color: 'inherit',
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontStyle: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
			},
		},
		color: {
			accent: { color: vars.color.foreground.accent.rest },
			danger: { color: vars.color.foreground.danger.rest },
			info: { color: vars.color.foreground.info.rest },
			primary: { color: vars.color.text.primary },
			secondary: { color: vars.color.text.secondary },
			success: { color: vars.color.foreground.success.rest },
			warning: { color: vars.color.foreground.warning.rest },
		},
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextRecipeVariants = RecipeSelection<typeof textRecipe>;
