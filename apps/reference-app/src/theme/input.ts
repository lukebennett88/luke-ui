import appleSystemMetrics from '@capsizecss/metrics/appleSystem';
import type { ThemeInput } from '@luke-ui/react/theme/compiler';

/** Quiet neutrals and a restrained purple accent. */
export const referenceThemeInput = {
	color: {
		accent: { dark: 'oklch(0.72 0.12 275)', light: 'oklch(0.55 0.14 275)' },
		neutralStyle: 'neutral',
	},
	depth: {
		dark: {
			floating: '0 4px 16px oklch(0.1 0.01 275 / 0.35), 0 1px 3px oklch(0.1 0.01 275 / 0.2)',
			overlay: '0 12px 32px oklch(0.1 0.01 275 / 0.4)',
			raised: '0 1px 2px oklch(0.1 0.01 275 / 0.28), 0 2px 8px oklch(0.1 0.01 275 / 0.18)',
			recessed: 'none',
			resting: 'none',
		},
		light: {
			floating: '0 4px 16px oklch(0.25 0.01 275 / 0.1), 0 1px 3px oklch(0.25 0.01 275 / 0.06)',
			overlay: '0 12px 32px oklch(0.2 0.01 275 / 0.12)',
			raised: '0 1px 2px oklch(0.3 0.01 275 / 0.04), 0 2px 8px oklch(0.3 0.01 275 / 0.06)',
			recessed: 'none',
			resting: 'none',
		},
	},
	name: 'reference',
	radius: { control: 6, surface: 8 },
	typography: {
		fonts: {
			// A system stack resolves to a different font on each platform. The metrics describe
			// Apple's system font, so trims are exact only where that font renders.
			body: {
				family: "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
				metrics: appleSystemMetrics,
			},
		},
		fontWeight: { heading: 600, label: 500 },
	},
} satisfies ThemeInput;
