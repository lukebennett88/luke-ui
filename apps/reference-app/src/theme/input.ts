import type { ThemeInput } from '@luke-ui/react/theme';

/**
 * Product-owned theme for the reference settings app.
 * Cool, low-chroma neutrals with a restrained blue accent.
 */
export const referenceThemeInput = {
	color: {
		accent: { dark: 'oklch(0.72 0.09 255)', light: 'oklch(0.48 0.1 255)' },
		neutralStyle: 'cool',
	},
	depth: {
		dark: {
			floating: 'none',
			overlay: '0 12px 32px oklch(0.1 0.01 255 / 0.4)',
			raised: 'none',
			recessed: 'none',
			resting: 'none',
		},
		light: {
			floating: 'none',
			overlay: '0 12px 32px oklch(0.2 0.01 255 / 0.12)',
			raised: 'none',
			recessed: 'none',
			resting: 'none',
		},
	},
	name: 'reference',
	radius: { control: 6, surface: 8 },
} satisfies ThemeInput;
