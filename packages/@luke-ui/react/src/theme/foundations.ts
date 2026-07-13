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
				'0 3px 0 oklch(0.05 0.01 220 / 0.55)',
				'0 5px 8px -2px oklch(0.05 0.01 220 / 0.32)',
			].join(', '),
			recessed: 'none',
			resting: [
				'0 2px 0 oklch(0.05 0.01 220 / 0.5)',
				'0 3px 5px -1px oklch(0.05 0.01 220 / 0.26)',
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
			raised: [
				'0 3px 0 oklch(0.3 0.03 220 / 0.3)',
				'0 5px 8px -2px oklch(0.3 0.03 220 / 0.2)',
			].join(', '),
			recessed: 'none',
			resting: [
				'0 2px 0 oklch(0.3 0.03 220 / 0.28)',
				'0 3px 5px -1px oklch(0.3 0.03 220 / 0.16)',
			].join(', '),
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
			raised: [
				'0 3px 0 oklch(0.12 0.01 250 / 0.28)',
				'0 5px 9px -2px oklch(0.12 0.01 250 / 0.22)',
			].join(', '),
			recessed: 'none',
			resting: [
				'0 2px 0 oklch(0.12 0.01 250 / 0.24)',
				'0 3px 6px -1px oklch(0.12 0.01 250 / 0.18)',
			].join(', '),
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
			raised: [
				'0 3px 0 oklch(0.2 0.01 250 / 0.16)',
				'0 5px 9px -2px oklch(0.2 0.01 250 / 0.12)',
			].join(', '),
			recessed: 'none',
			resting: [
				'0 2px 0 oklch(0.2 0.01 250 / 0.14)',
				'0 3px 6px -1px oklch(0.2 0.01 250 / 0.08)',
			].join(', '),
		},
	},
	name: 'elmo',
};
