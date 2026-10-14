import { vars } from '@luke-ui/react/theme';
import { keyframes, style } from '@vanilla-extract/css';

const motionSample = keyframes({
	from: { transform: 'translateX(-0.75rem)' },
	to: { transform: 'translateX(0.75rem)' },
});

/** Flat purpose-group separator. */
export const group = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			selectors: {
				'&:last-child': {
					borderBlockEndWidth: 0,
				},
			},
		},
	},
});

/** Top rule before the native token table. */
export const tableScroll = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
		},
	},
});

export const table = style({
	'@layer': {
		components: {
			borderCollapse: 'collapse',
			fontSize: vars.font.caption.fontSize,
			inlineSize: '100%',
			lineHeight: vars.font.caption.lineHeight,
			minInlineSize: '32rem',
		},
	},
});

export const tableWithSamples = style({
	'@layer': {
		components: {
			minInlineSize: '40rem',
		},
	},
});

export const tableHeaderRow = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			textAlign: 'start',
		},
	},
});

export const sampleHeaderCell = style({
	'@layer': {
		components: {
			inlineSize: '8rem',
		},
	},
});

export const tableHeaderCell = style({
	'@layer': {
		components: {
			fontWeight: vars.font.weight.label,
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp12,
		},
	},
});

export const tableRow = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			selectors: {
				'&:last-child': {
					borderBlockEndWidth: 0,
				},
			},
		},
	},
});

/** Cell padding; Box cannot render `th`/`td`. */
export const tableCell = style({
	'@layer': {
		components: {
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp12,
			verticalAlign: 'middle',
		},
	},
});

export const variableCode = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
		},
	},
});

export const relatedLink = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			textUnderlineOffset: '0.25em',
			selectors: {
				'&:hover': {
					color: vars.color.text.primary,
					textDecoration: 'underline',
				},
			},
		},
	},
});

export const motionDot = style({
	'@layer': {
		components: {
			animationDirection: 'alternate',
			animationIterationCount: 'infinite',
			animationName: motionSample,
			backgroundColor: vars.color.background.accent.solid.rest,
			blockSize: vars.space.sp16,
			borderRadius: vars.radius.full,
			inlineSize: vars.space.sp16,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					animation: 'none',
				},
			},
		},
	},
});
