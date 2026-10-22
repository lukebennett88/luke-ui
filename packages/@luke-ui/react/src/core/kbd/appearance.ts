import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { surfaceStyle } from '../styles/surface.js';

/** A key chip. Its subdued surface sets its own foreground context, whatever surrounds it. */
export const kbdAppearance = {
	...surfaceStyle('surface.subdued'),
	alignItems: 'center',
	blockSize: 'fit-content',
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.control,
	borderStyle: 'solid',
	borderWidth: '1px',
	display: 'inline-flex',
	flexShrink: 0,
	fontFamily: vars.font.family.body,
	fontSize: '0.75em',
	fontWeight: vars.font.weight.body,
	inlineSize: 'fit-content',
	justifyContent: 'center',
	letterSpacing: '0.035em',
	lineHeight: 1.4,
	minInlineSize: '1.75em',
	paddingBlock: '0.1em',
	paddingInline: '0.35em',
	verticalAlign: 'middle',
	whiteSpace: 'nowrap',
	wordSpacing: '0.08em',
} as const satisfies StyleRule;
