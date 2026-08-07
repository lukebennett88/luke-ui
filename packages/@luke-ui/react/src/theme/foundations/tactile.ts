import type { ThemeInput } from '../define-theme.js';

/**
 * Tactile, the default bundled theme: a teal accent, a neutral near-white light canvas, lighter
 * chromatic dark surfaces, and a compact tactile material. Both modes are authored explicitly, so
 * `defineTheme` uses each side verbatim.
 */
// Multi-layer values below are concatenated string literals, not `[...].join(', ')`, because a
// joined value survives dead-code elimination even when unused. See `themes/theme-bundle.test.ts`.
export const tactileTheme: ThemeInput = {
	actionControlFinish: {
		dark: {
			raised:
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.18) 0%, transparent 100%), ' +
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.1) 0%, transparent 70%)',
			recessed:
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.08) 0%, transparent 100%), ' +
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.04) 0%, transparent 70%)',
			resting:
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.14) 0%, transparent 100%), ' +
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.07) 0%, transparent 70%)',
		},
		light: {
			raised:
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.3) 0%, transparent 100%), ' +
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.16) 0%, transparent 70%)',
			recessed:
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.12) 0%, transparent 100%), ' +
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.06) 0%, transparent 70%)',
			resting:
				'radial-gradient(80% 70% at 50% 0%, rgb(255 255 255 / 0.24) 0%, transparent 100%), ' +
				'radial-gradient(70% 45% at 50% 110%, rgb(255 255 255 / 0.12) 0%, transparent 70%)',
		},
	},
	color: {
		accent: { dark: 'oklch(0.75 0.1 200)', light: 'oklch(0.52 0.11 200)' },
		neutral: { dark: 'oklch(0.25 0.015 210)', light: 'oklch(0.985 0 0)' },
	},
	depth: {
		dark: {
			floating: '0 4px 12px oklch(0.05 0.01 220 / 0.38), 0 2px 4px oklch(0.05 0.01 220 / 0.22)',
			overlay: '0 12px 32px oklch(0.05 0.01 220 / 0.5), 0 4px 12px oklch(0.05 0.01 220 / 0.28)',
			raised: '0 3px 0 oklch(0.05 0.01 220 / 0.55), 0 5px 8px -2px oklch(0.05 0.01 220 / 0.32)',
			recessed:
				'inset 0 2px 4px oklch(0.05 0.01 220 / 0.45), inset 0 -1px 0 oklch(0.8 0.01 220 / 0.12)',
			resting: '0 2px 0 oklch(0.05 0.01 220 / 0.5), 0 3px 5px -1px oklch(0.05 0.01 220 / 0.26)',
		},
		light: {
			floating: '0 4px 12px oklch(0.3 0.03 220 / 0.16), 0 2px 4px oklch(0.3 0.03 220 / 0.1)',
			overlay: '0 12px 32px oklch(0.3 0.03 220 / 0.2), 0 4px 12px oklch(0.3 0.03 220 / 0.12)',
			raised: '0 3px 0 oklch(0.3 0.03 220 / 0.3), 0 5px 8px -2px oklch(0.3 0.03 220 / 0.2)',
			recessed:
				'inset 0 2px 3px oklch(0.3 0.03 220 / 0.18), inset 0 -1px 0 oklch(0.98 0.03 220 / 0.65)',
			resting: '0 2px 0 oklch(0.3 0.03 220 / 0.28), 0 3px 5px -1px oklch(0.3 0.03 220 / 0.16)',
		},
	},
	name: 'tactile',
};
