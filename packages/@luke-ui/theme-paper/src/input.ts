import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { THEME_NAME } from './name.js';

/**
 * Paper's `defineTheme` input: a materially minimal theme with flat, hairline-bordered surfaces and
 * a blue `#185281`-family accent. Its light mode authors the status colours, and its dark mode lets
 * `info`, `success`, and `warning` fall back to the curated mode defaults. Set it as `extends` on
 * your own input to start from Paper.
 */
export const theme: ThemeInput = {
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
			raised:
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.2) 0%, transparent 100%), ' +
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.1) 0%, transparent 70%)',
			recessed: 'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.08) 0%, transparent 100%)',
			resting:
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.16) 0%, transparent 100%), ' +
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.07) 0%, transparent 70%)',
		},
	},
	color: {
		accent: { dark: 'oklch(0.7 0.11 250)', light: '#185281' },
		// Feedback colours are authored for light only; the omitted dark sides default per mode.
		danger: { light: '#c0262e' },
		info: { light: '#1d39c4' },
		neutral: { dark: 'oklch(0.22 0.01 250)', light: '#ffffff' },
		success: { light: '#306317' },
		warning: { light: '#d89614' },
	},
	depth: {
		dark: {
			floating: '0 4px 14px oklch(0.12 0.01 250 / 0.25)',
			overlay: '0 12px 36px oklch(0.12 0.01 250 / 0.32)',
			raised: '0 2px 6px oklch(0.12 0.01 250 / 0.18), 0 1px 3px oklch(0.12 0.01 250 / 0.12)',
			recessed: 'inset 0 1px 2px oklch(0.12 0.01 250 / 0.22)',
			resting: '0 1px 3px oklch(0.12 0.01 250 / 0.12), 0 1px 2px oklch(0.12 0.01 250 / 0.06)',
		},
		light: {
			floating: '0 4px 14px oklch(0.2 0.01 250 / 0.12)',
			overlay: '0 12px 36px oklch(0.2 0.01 250 / 0.16)',
			raised: '0 2px 6px oklch(0.2 0.01 250 / 0.05), 0 1px 3px oklch(0.2 0.01 250 / 0.035)',
			recessed: 'none',
			resting: '0 1px 3px oklch(0.2 0.01 250 / 0.04), 0 1px 2px oklch(0.2 0.01 250 / 0.02)',
		},
	},
	name: THEME_NAME,
	radius: { control: 4 },
	typography: {
		fonts: {
			body: {
				family: "'Inter', system-ui, sans-serif",
				// Capsize metrics of the bundled Inter, `fonts/inter-latin-wght-normal.woff2`.
				metrics: {
					ascent: 1984,
					capHeight: 1490,
					descent: -494,
					familyName: 'Inter',
					lineGap: 0,
					unitsPerEm: 2048,
				},
			},
		},
	},
};
