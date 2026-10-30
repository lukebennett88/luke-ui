import type { ThemeInput } from '../define-theme.js';
import { paperTheme } from './paper.js';

/** A custom theme with contrasting chromatic source colours and input forms. */
export const chromaticTheme: ThemeInput = {
	...paperTheme,
	name: 'chromatic-fixture',
	color: {
		accent: '#facc15',
		info: { dark: '#2563eb' },
		success: '#22c55e',
		warning: '#facc15',
		danger: { light: '#ef4444' },
	},
};
