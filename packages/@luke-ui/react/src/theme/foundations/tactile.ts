import type { ThemeInput } from '../define-theme.js';

/**
 * Tactile, the default bundled theme: a teal accent, a neutral near-white light canvas, lighter
 * chromatic dark surfaces, and a restrained material lit from above. Both modes are authored
 * explicitly, so `defineTheme` uses each side as written.
 */
// Multi-layer values below are concatenated string literals, not `[...].join(', ')`, because a
// joined value survives dead-code elimination even when unused. See `themes/theme-bundle.test.ts`.
export const tactileTheme: ThemeInput = {
	// A solid face is lighter at the top and slightly darker at the bottom. Pressed reverses it.
	controlFinish: {
		dark: {
			raised:
				'linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0) 60%, ' +
				'rgb(0 0 0 / 0.06))',
			recessed: 'linear-gradient(to bottom, rgb(0 0 0 / 0.14), rgb(0 0 0 / 0) 55%)',
			resting:
				'linear-gradient(to bottom, rgb(255 255 255 / 0.11), rgb(255 255 255 / 0) 60%, ' +
				'rgb(0 0 0 / 0.08))',
		},
		light: {
			raised:
				'linear-gradient(to bottom, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0) 60%, ' +
				'rgb(0 0 0 / 0.03))',
			recessed: 'linear-gradient(to bottom, rgb(0 0 0 / 0.07), rgb(0 0 0 / 0) 55%)',
			resting:
				'linear-gradient(to bottom, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0) 60%, ' +
				'rgb(0 0 0 / 0.05))',
		},
	},
	color: {
		accent: { dark: 'oklch(0.75 0.1 200)', light: 'oklch(0.52 0.11 200)' },
		neutral: { dark: 'oklch(0.25 0.015 210)', light: 'oklch(0.985 0 0)' },
	},
	// Raised rungs: a faint top highlight and blurred shadows; a zero-blur offset would read as a
	// second edge. Recessed: one soft inset shadow from above.
	depth: {
		dark: {
			floating: '0 4px 12px oklch(0.05 0.01 220 / 0.38), 0 2px 4px oklch(0.05 0.01 220 / 0.22)',
			overlay: '0 12px 32px oklch(0.05 0.01 220 / 0.5), 0 4px 12px oklch(0.05 0.01 220 / 0.28)',
			raised:
				'inset 0 1px 0 rgb(255 255 255 / 0.1), 0 2px 4px oklch(0.05 0.01 220 / 0.5), ' +
				'0 4px 10px -2px oklch(0.05 0.01 220 / 0.36)',
			recessed: 'inset 0 1px 3px oklch(0.05 0.01 220 / 0.45)',
			resting:
				'inset 0 1px 0 rgb(255 255 255 / 0.07), 0 1px 2px oklch(0.05 0.01 220 / 0.45), ' +
				'0 2px 5px -1px oklch(0.05 0.01 220 / 0.3)',
		},
		light: {
			floating: '0 4px 12px oklch(0.3 0.03 220 / 0.16), 0 2px 4px oklch(0.3 0.03 220 / 0.1)',
			overlay: '0 12px 32px oklch(0.3 0.03 220 / 0.2), 0 4px 12px oklch(0.3 0.03 220 / 0.12)',
			raised:
				'inset 0 1px 0 rgb(255 255 255 / 0.28), 0 2px 4px oklch(0.3 0.03 220 / 0.16), ' +
				'0 4px 10px -2px oklch(0.3 0.03 220 / 0.14)',
			recessed: 'inset 0 1px 3px oklch(0.3 0.03 220 / 0.18)',
			resting:
				'inset 0 1px 0 rgb(255 255 255 / 0.2), 0 1px 2px oklch(0.3 0.03 220 / 0.18), ' +
				'0 2px 5px -1px oklch(0.3 0.03 220 / 0.1)',
		},
	},
	name: 'tactile',
};
