import type { ThemeInput } from '../define-theme.js';
import { paperTheme } from './paper.js';

/** Paper with a light accent and a dark raised surface that sit at the edge of the contrast gates. */
export const contrastEdgeTheme: ThemeInput = {
	...paperTheme,
	color: {
		...paperTheme.color,
		accent: { light: '#fde68a' },
		surface: { raised: { dark: 'oklch(0.30 0.01 250)' } },
	},
	name: 'contrast-edge-fixture',
};
