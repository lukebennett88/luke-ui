import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { containerSurfaceStyle } from '../styles/surface.js';

export const codeAppearance = {
	// A neutral subtle fill with a hairline separates from every surface in every theme identity
	// and colour mode, which a surface tint alone does not. The fill sets its own foreground context,
	// so code on a solid fill reads the neutral hierarchy rather than the solid's on-solid colour.
	...containerSurfaceStyle('neutral.subtle'),
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.control,
	fontFamily: vars.font.family.code,
	// Monospace reads large at the same nominal size. Use `em` so the correction tracks the
	// inherited size.
	fontSize: '0.875em',
	paddingBlock: '0.15em',
	paddingInline: '0.3em',
} as const satisfies StyleRule;
