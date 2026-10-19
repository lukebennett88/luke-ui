import { vars } from '@luke-ui/react/theme';
import { style, styleVariants } from '@vanilla-extract/css';
import { overlayMotion } from '../lib/overlay-motion.js';
import { scopeColors } from '../lib/shiki-theme.js';
import type { TypeTokenKind } from '../lib/type-tokens.js';

/**
 * Formatted types keep the build's line breaks and indentation. Lines wrap at the break
 * opportunities before punctuation, as in React Aria's type renderer.
 */
export const tokens = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			tabSize: 2,
			whiteSpace: 'pre-wrap',
		},
	},
});

/** The TextMate scope whose Shiki colour each token kind takes, so types match code blocks. */
const TOKEN_SCOPES: Record<TypeTokenKind, string> = {
	k: 'keyword',
	l: 'constant',
	p: 'variable',
	s: 'string',
	t: 'entity.name',
};

export const tokenKind = styleVariants(TOKEN_SCOPES, (scope) => {
	const { dark, light } = scopeColors(scope);
	return { '@layer': { components: { color: `light-dark(${light}, ${dark})` } } };
});

/**
 * Underlines the type name so it reads as interactive without a link's pointer cursor. It keeps the
 * surrounding code's font, because a button sets its own.
 */
export const trigger = style({
	'@layer': {
		components: {
			fontFamily: 'inherit',
			fontSize: 'inherit',
			fontWeight: 'inherit',
			lineHeight: 'inherit',
			textDecorationLine: 'underline',
			textDecorationStyle: 'dotted',
			textUnderlineOffset: '0.2em',
			selectors: {
				'&:hover': {
					textDecorationStyle: 'solid',
				},
			},
		},
	},
});

export const popover = style({
	'@layer': {
		components: {
			// The popover opens below its trigger, so it settles down from just above.
			...overlayMotion({
				hidden: { opacity: 0, translate: '0 -4px' },
				properties: ['opacity', 'translate'],
				rule: {
					backgroundColor: vars.color.surface.overlay,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.floating,
					maxInlineSize: 'min(36rem, calc(100vw - 2rem))',
					maxBlockSize: 'min(24rem, calc(100vh - 4rem))',
					overflow: 'auto',
					padding: vars.space['12'],
					translate: 'none',
					zIndex: 50,
				},
			}),
		},
	},
});

/** The dialog takes focus when it opens. The popover surface already shows where focus went. */
export const dialog = style({
	'@layer': {
		components: {
			outline: 'none',
		},
	},
});

/**
 * Keeps the declaration's own line breaks and indentation. Source indents with tabs, which default to
 * eight columns and would take most of a phone's width.
 */
export const definition = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			overflowWrap: 'anywhere',
			tabSize: 2,
			whiteSpace: 'pre-wrap',
		},
	},
});

/** The trail of types opened inside one popover, as React Aria's type popover shows it. */
export const breadcrumbs = style({
	'@layer': {
		components: {
			display: 'flex',
			flexWrap: 'wrap',
			fontFamily: vars.font.family.code,
			fontSize: vars.font.label.fontSize,
			gap: vars.space['4'],
			lineHeight: vars.font.label.lineHeight,
			listStyle: 'none',
			margin: 0,
			padding: 0,
		},
	},
});

export const breadcrumb = style({
	'@layer': {
		components: {
			display: 'flex',
			gap: vars.space['4'],
			selectors: {
				'&:not(:last-child)::after': {
					color: vars.color.text.secondary,
					content: "'/'",
				},
			},
		},
	},
});
