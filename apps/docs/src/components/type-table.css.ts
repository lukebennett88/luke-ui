import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

/**
 * Caption metrics on the table root so Track `firstLine` rails share the same 1lh as prop/type
 * text. Layout chrome lives on Stack/Track/Box.
 */
export const root = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
		},
	},
});

/** Row separator + hash scroll margin; expanded rows stay flat (no raised card). */
export const row = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
			selectors: {
				'&:last-child': {
					borderBlockEndWidth: 0,
				},
				'&[data-expanded]': {
					backgroundColor: vars.color.surface.subdued,
				},
			},
		},
	},
});

/**
 * Strip Code's chip chrome so prop names read as labels, not disabled inputs. Keep the code font
 * and optical sizing from `Code`.
 */
export const propName = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderRadius: 0,
			borderStyle: 'none',
			borderWidth: 0,
			fontWeight: vars.font.weight.label,
			paddingBlock: 0,
			paddingInline: 0,
		},
	},
});

export const propNameDeprecated = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			textDecoration: 'line-through',
		},
	},
});

/**
 * Long union types wrap instead of forcing horizontal scroll in the article column.
 * Nested Shiki/`Code` chips are stripped via `globalStyle` below.
 */
export const propType = style({
	'@layer': {
		components: {
			overflowWrap: 'anywhere',
		},
	},
});

export const propTypeLink = style({
	'@layer': {
		components: {
			textUnderlineOffset: '0.15em',
		},
	},
});

const flatNestedCode = {
	backgroundColor: 'transparent',
	borderColor: 'transparent',
	borderRadius: 0,
	borderStyle: 'none',
	borderWidth: 0,
	fontSize: 'inherit',
	lineHeight: 'inherit',
	paddingBlock: 0,
	paddingInline: 0,
} as const;

/** Generator `typeDescription` nodes often wrap Shiki/`Code` chips — flatten them. */
globalStyle(`${propType} code`, {
	'@layer': {
		components: flatNestedCode,
	},
});

globalStyle(`${propTypeLink} code`, {
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderRadius: 0,
			borderStyle: 'none',
			borderWidth: 0,
			paddingBlock: 0,
			paddingInline: 0,
		},
	},
});
