import interMetrics from '@capsizecss/metrics/inter';
import type { ThemeInput } from '../define-theme.js';

/**
 * The visual-test copy of Paper. It may differ from the published input except for solid fills,
 * on-solid text, and control finish, which the packed-consumer harness checks. Its light status
 * sources supply the hues for the generated dark info, success, and warning counterparts.
 */
export const paperTheme: ThemeInput = {
	controlFinish: {
		dark: { raised: 'none', recessed: 'none', resting: 'none' },
		light: { raised: 'none', recessed: 'none', resting: 'none' },
	},
	color: {
		accent: { dark: 'oklch(0.48 0.11 250)', light: '#185281' },
		// Preserve the dark danger treatment; derive other dark feedback colours from their light sources.
		danger: { light: '#c0262e', dark: 'oklch(0.48 0.16 25)' },
		info: { light: '#1d39c4' },
		neutral: { dark: 'oklch(0.22 0.01 250)', light: '#ffffff' },
		success: { light: '#306317' },
		warning: { light: '#d89614' },
	},
	shadow: {
		dark: {
			floating: '0 4px 14px oklch(0.12 0.01 250 / 0.25)',
			overlay: '0 12px 36px oklch(0.12 0.01 250 / 0.32)',
			raised: 'none',
			inset: 'none',
			resting: 'none',
		},
		light: {
			floating: '0 4px 14px oklch(0.2 0.01 250 / 0.12)',
			overlay: '0 12px 36px oklch(0.2 0.01 250 / 0.16)',
			raised: 'none',
			inset: 'none',
			resting: 'none',
		},
	},
	name: 'paper',
	radius: { control: 4 },
	typography: {
		fonts: { body: { family: "'Inter', system-ui, sans-serif", metrics: interMetrics } },
	},
};
