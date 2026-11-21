import appleSystemMetrics from '@capsizecss/metrics/appleSystem';
import type { ThemeInput } from '@luke-ui/react/theme/compiler';

/**
 * Quiet cool neutrals and an indigo accent for the review chrome. It stays visibly different from
 * the Paper and Tactile captures the app reviews, so the screenshots carry the colour.
 */
export const visualReviewThemeInput = {
	color: {
		accent: { dark: 'oklch(0.71 0.16 282)', light: 'oklch(0.49 0.21 281)' },
		focus: { dark: 'oklch(0.77 0.125 282)', light: 'oklch(0.51 0.21 281)' },
		neutral: { style: 'cool' },
		surface: {
			base: { dark: 'oklch(0.178 0.003 280)', light: 'oklch(0.988 0.001 280)' },
			raised: { dark: 'oklch(0.248 0.006 280)', light: 'oklch(1 0 0)' },
			subdued: { dark: 'oklch(0.205 0.004 280)', light: 'oklch(0.966 0.002 280)' },
		},
	},
	name: 'visual-review',
	// Flat, square controls keep the chrome quiet beside the screenshots it frames.
	radius: { control: 0, detail: 3, overlay: 10, surface: 8 },
	shadow: {
		dark: {
			floating: '0 8px 24px oklch(0 0 0 / 0.46)',
			inset: 'none',
			overlay: '0 12px 32px oklch(0 0 0 / 0.5)',
			raised: 'none',
			resting: 'none',
		},
		light: {
			floating: '0 6px 20px oklch(0.2 0.01 280 / 0.16)',
			inset: 'none',
			overlay: '0 12px 32px oklch(0.2 0.01 280 / 0.18)',
			raised: 'none',
			resting: 'none',
		},
	},
	typography: {
		fontWeight: { heading: 600, label: 500 },
		fonts: {
			// A system stack resolves to a different font on each platform. The metrics describe
			// Apple's system font, so trims are exact only where that font renders.
			body: {
				family: "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
				metrics: appleSystemMetrics,
			},
		},
	},
} satisfies ThemeInput;
