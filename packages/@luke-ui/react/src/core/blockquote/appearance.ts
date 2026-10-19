import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';

export const blockquoteAppearance = {
	borderInlineStart: `3px solid ${vars.color.border.decorative}`,
	paddingInlineStart: vars.space['16'],
} as const satisfies StyleRule;
