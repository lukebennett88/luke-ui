import type { ThemeInput } from '../define-theme.js';
import { paperTheme } from './paper.js';

/** A custom theme with contrasting chromatic source colours and input forms. */
export const chromaticTheme: ThemeInput = {
	...paperTheme,
	name: 'chromatic-fixture',
	controlFinish: {
		dark: {
			raised:
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.1) 0%, transparent 100%), ' +
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.05) 0%, transparent 70%)',
			recessed: 'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.04) 0%, transparent 100%)',
			resting:
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.07) 0%, transparent 100%), ' +
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.03) 0%, transparent 70%)',
		},
		light: {
			raised: 'linear-gradient(rgb(255 255 255 / 0.03), rgb(255 255 255 / 0.03))',
			recessed: 'linear-gradient(rgb(255 255 255 / 0.03), rgb(255 255 255 / 0.03))',
			resting: 'linear-gradient(rgb(255 255 255 / 0.03), rgb(255 255 255 / 0.03))',
		},
	},
	color: {
		accent: '#facc15',
		info: { dark: '#2563eb' },
		success: '#22c55e',
		warning: '#facc15',
		danger: { light: '#ef4444' },
	},
};
