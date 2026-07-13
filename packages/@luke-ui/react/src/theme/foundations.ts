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
		material: {
			blur: 'sharp',
			edgeStrength: 0.55,
			highlightStrength: 0.14,
			lowerEdgeDepth: 2,
			shadowColor: 'oklch(0.05 0.01 220)',
			shadowStrength: 0.55,
		},
	},
	light: {
		color: {
			accent: 'oklch(0.52 0.11 200)',
			neutral: 'oklch(0.975 0.008 210)',
		},
		material: {
			blur: 'sharp',
			edgeStrength: 0.45,
			highlightStrength: 0.9,
			lowerEdgeDepth: 2,
			shadowColor: 'oklch(0.3 0.03 220)',
			shadowStrength: 0.22,
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
		material: {
			blur: 'soft',
			edgeStrength: 0.45,
			highlightStrength: 0.05,
			lowerEdgeDepth: 0,
			shadowColor: 'oklch(0.12 0.01 250)',
			shadowStrength: 0.35,
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
		material: {
			blur: 'soft',
			edgeStrength: 0.35,
			highlightStrength: 0,
			lowerEdgeDepth: 0,
			shadowColor: 'oklch(0.2 0.01 250)',
			shadowStrength: 0.1,
		},
	},
	name: 'elmo',
};
