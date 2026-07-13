import type { ThemeFoundation } from './foundation.js';

/**
 * Foundation for Machined edge, the default bundled theme: teal accent, cool low-chroma tinted
 * light surfaces, lighter chromatic dark surfaces, and a compact tactile material.
 */
export const machinedEdgeFoundation: ThemeFoundation = {
	dark: {
		color: {
			accent: 'oklch(0.75 0.1 200)',
			neutral: 'oklch(0.25 0.015 210)',
		},
		depth: {
			floating: [
				'0 4px 12px oklch(0.05 0.01 220 / 0.38)',
				'0 2px 4px oklch(0.05 0.01 220 / 0.22)',
			].join(', '),
			overlay: [
				'0 12px 32px oklch(0.05 0.01 220 / 0.5)',
				'0 4px 12px oklch(0.05 0.01 220 / 0.28)',
			].join(', '),
			raised: [
				'inset 0 2px 1px -1px oklch(1 0 0 / 0.18)',
				'inset 0 -3px 1px -1px oklch(0.05 0.01 220 / 0.55)',
				'0 3px 5px oklch(0.05 0.01 220 / 0.32)',
			].join(', '),
			recessed: 'inset 0 3px 4px -2px oklch(0.05 0.01 220 / 0.45)',
			resting: [
				'inset 0 2px 1px -1px oklch(1 0 0 / 0.18)',
				'inset 0 -3px 1px -1px oklch(0.05 0.01 220 / 0.55)',
				'0 2px 3px oklch(0.05 0.01 220 / 0.26)',
			].join(', '),
		},
	},
	light: {
		color: {
			accent: 'oklch(0.52 0.11 200)',
			neutral: 'oklch(0.975 0.008 210)',
		},
		depth: {
			floating: '0 4px 12px oklch(0.3 0.03 220 / 0.16), 0 2px 4px oklch(0.3 0.03 220 / 0.1)',
			overlay: '0 12px 32px oklch(0.3 0.03 220 / 0.2), 0 4px 12px oklch(0.3 0.03 220 / 0.12)',
			raised:
				'inset 0 2px 1px -1px oklch(1 0 0 / 0.65), inset 0 -3px 1px -1px oklch(0.3 0.03 220 / 0.32), 0 3px 5px oklch(0.3 0.03 220 / 0.2)',
			recessed: 'inset 0 3px 4px -2px oklch(0.3 0.03 220 / 0.28)',
			resting:
				'inset 0 2px 1px -1px oklch(1 0 0 / 0.65), inset 0 -3px 1px -1px oklch(0.3 0.03 220 / 0.32), 0 2px 3px oklch(0.3 0.03 220 / 0.16)',
		},
	},
	name: 'machined-edge',
};

/**
 * Foundation for ELMO, the materially minimal bundled theme. Its light mode approximates the flat,
 * hairline-bordered Luke UI look with the blue `#0160ae`-family accent; its dark mode is net-new.
 */
export const elmoFoundation: ThemeFoundation = {
	dark: {
		color: {
			accent: 'oklch(0.7 0.11 250)',
			neutral: 'oklch(0.22 0.01 250)',
		},
		depth: {
			floating: '0 4px 14px oklch(0.12 0.01 250 / 0.25)',
			overlay: '0 12px 36px oklch(0.12 0.01 250 / 0.32)',
			raised: 'inset 0 2px 1px -1px oklch(1 0 0 / 0.08), 0 3px 7px oklch(0.12 0.01 250 / 0.22)',
			recessed: 'inset 0 3px 5px -2px oklch(0.12 0.01 250 / 0.22)',
			resting: 'inset 0 2px 1px -1px oklch(1 0 0 / 0.08), 0 2px 4px oklch(0.12 0.01 250 / 0.18)',
		},
	},
	light: {
		color: {
			accent: '#0160ae',
			danger: '#c0262e',
			info: '#1d39c4',
			neutral: '#ffffff',
			success: '#306317',
			warning: '#d89614',
		},
		depth: {
			floating: '0 4px 14px oklch(0.2 0.01 250 / 0.12)',
			overlay: '0 12px 36px oklch(0.2 0.01 250 / 0.16)',
			raised: 'inset 0 2px 1px -1px oklch(1 0 0 / 0.45), 0 3px 7px oklch(0.2 0.01 250 / 0.12)',
			recessed: 'inset 0 3px 5px -2px oklch(0.2 0.01 250 / 0.14)',
			resting: 'inset 0 2px 1px -1px oklch(1 0 0 / 0.45), 0 2px 4px oklch(0.2 0.01 250 / 0.08)',
		},
	},
	name: 'elmo',
};
