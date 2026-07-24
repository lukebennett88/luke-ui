import type { ThemeInput } from './define-theme.js';

/**
 * Tactile, the default bundled theme: a teal accent, a neutral near-white light canvas, lighter
 * chromatic dark surfaces, and a compact tactile material. Both modes are authored explicitly, so
 * `defineTheme` uses each side verbatim.
 */
export const tactileTheme: ThemeInput = {
	actionControlFinish: {
		dark: {
			raised: [
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.18) 0%, transparent 100%)',
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.1) 0%, transparent 70%)',
			].join(', '),
			recessed: [
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.08) 0%, transparent 100%)',
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.04) 0%, transparent 70%)',
			].join(', '),
			resting: [
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.14) 0%, transparent 100%)',
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.07) 0%, transparent 70%)',
			].join(', '),
		},
		light: {
			raised: [
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.3) 0%, transparent 100%)',
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.16) 0%, transparent 70%)',
			].join(', '),
			recessed: [
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.12) 0%, transparent 100%)',
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.06) 0%, transparent 70%)',
			].join(', '),
			resting: [
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.24) 0%, transparent 100%)',
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.12) 0%, transparent 70%)',
			].join(', '),
		},
	},
	color: {
		accent: { dark: 'oklch(0.75 0.1 200)', light: 'oklch(0.52 0.11 200)' },
		neutral: { dark: 'oklch(0.25 0.015 210)', light: 'oklch(0.985 0 0)' },
	},
	depth: {
		dark: {
			floating: [
				'0 4px 12px oklch(0.05 0.01 220 / 0.38)',
				'0 2px 4px oklch(0.05 0.01 220 / 0.22)',
			].join(', '),
			overlay: [
				'0 12px 32px oklch(0.05 0.01 220 / 0.5)',
				'0 4px 12px oklch(0.05 0.01 220 / 0.28)',
			].join(', '),
			raised: [
				'0 3px 0 oklch(0.05 0.01 220 / 0.55)',
				'0 5px 8px -2px oklch(0.05 0.01 220 / 0.32)',
			].join(', '),
			recessed: [
				'inset 0 2px 4px oklch(0.05 0.01 220 / 0.45)',
				'inset 0 -1px 0 oklch(0.8 0.01 220 / 0.12)',
			].join(', '),
			resting: [
				'0 2px 0 oklch(0.05 0.01 220 / 0.5)',
				'0 3px 5px -1px oklch(0.05 0.01 220 / 0.26)',
			].join(', '),
		},
		light: {
			floating: [
				'0 4px 12px oklch(0.3 0.03 220 / 0.16)',
				'0 2px 4px oklch(0.3 0.03 220 / 0.1)',
			].join(', '),
			overlay: [
				'0 12px 32px oklch(0.3 0.03 220 / 0.2)',
				'0 4px 12px oklch(0.3 0.03 220 / 0.12)',
			].join(', '),
			raised: [
				'0 3px 0 oklch(0.3 0.03 220 / 0.3)',
				'0 5px 8px -2px oklch(0.3 0.03 220 / 0.2)',
			].join(', '),
			recessed: [
				'inset 0 2px 3px oklch(0.3 0.03 220 / 0.18)',
				'inset 0 -1px 0 oklch(0.98 0.03 220 / 0.65)',
			].join(', '),
			resting: [
				'0 2px 0 oklch(0.3 0.03 220 / 0.28)',
				'0 3px 5px -1px oklch(0.3 0.03 220 / 0.16)',
			].join(', '),
		},
	},
	name: 'tactile',
};

/**
 * Paper, the materially minimal bundled theme. Its light mode approximates the flat,
 * hairline-bordered Luke UI look with the blue `#185281`-family accent and explicitly authored
 * feedback colours; its dark mode is net-new and lets the feedback intents fall back to the curated
 * mode defaults (their dark sides are omitted).
 */
export const paperTheme: ThemeInput = {
	actionControlFinish: {
		dark: {
			raised: [
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.1) 0%, transparent 100%)',
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.05) 0%, transparent 70%)',
			].join(', '),
			recessed: 'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.04) 0%, transparent 100%)',
			resting: [
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.07) 0%, transparent 100%)',
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.03) 0%, transparent 70%)',
			].join(', '),
		},
		light: {
			raised: [
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.2) 0%, transparent 100%)',
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.1) 0%, transparent 70%)',
			].join(', '),
			recessed: 'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.08) 0%, transparent 100%)',
			resting: [
				'radial-gradient(90% 75% at 50% 0%, rgb(255 255 255 / 0.16) 0%, transparent 100%)',
				'radial-gradient(80% 50% at 50% 110%, rgb(255 255 255 / 0.07) 0%, transparent 70%)',
			].join(', '),
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
			raised: [
				'0 2px 6px oklch(0.12 0.01 250 / 0.18)',
				'0 1px 3px oklch(0.12 0.01 250 / 0.12)',
			].join(', '),
			recessed: 'inset 0 1px 2px oklch(0.12 0.01 250 / 0.22)',
			resting: [
				'0 1px 3px oklch(0.12 0.01 250 / 0.12)',
				'0 1px 2px oklch(0.12 0.01 250 / 0.06)',
			].join(', '),
		},
		light: {
			floating: '0 4px 14px oklch(0.2 0.01 250 / 0.12)',
			overlay: '0 12px 36px oklch(0.2 0.01 250 / 0.16)',
			raised: [
				'0 2px 6px oklch(0.2 0.01 250 / 0.05)',
				'0 1px 3px oklch(0.2 0.01 250 / 0.035)',
			].join(', '),
			recessed: 'none',
			resting: [
				'0 1px 3px oklch(0.2 0.01 250 / 0.04)',
				'0 1px 2px oklch(0.2 0.01 250 / 0.02)',
			].join(', '),
		},
	},
	name: 'paper',
	radius: { control: 4 },
};
