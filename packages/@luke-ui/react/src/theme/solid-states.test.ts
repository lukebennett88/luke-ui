import { describe, expect, it } from 'vite-plus/test';
import { chromaticTheme } from './__fixtures__/chromatic.js';
import { paperTheme } from './__fixtures__/paper.js';
import { tactileTheme } from './__fixtures__/tactile.js';
import { splitBlocks } from './__fixtures__/theme-css.js';
import { compileTheme } from './build-theme.js';
import { contrastRatio, parseColor } from './color.js';
import {
	INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
	INTERACTION_HOVER_VISIBILITY,
	SEMANTIC_ROLES,
	TEXT_RATIO,
} from './contrast-policy.js';
import type { ThemeInput } from './define-theme.js';
import { normalizeTheme } from './define-theme.js';
import { oklabDeltaE } from './scale.js';

const contrastEdgeTheme: ThemeInput = {
	...paperTheme,
	color: {
		...paperTheme.color,
		accent: { light: '#fde68a' },
		surface: { raised: { dark: 'oklch(0.30 0.01 250)' } },
	},
	name: 'contrast-edge-fixture',
};

const FIXTURES = {
	chromatic: chromaticTheme,
	contrastEdge: contrastEdgeTheme,
	paper: paperTheme,
	tactile: tactileTheme,
} as const;

const MODES = ['light', 'dark'] as const;

function value(block: string, name: string) {
	const match = new RegExp(`${name}: ([^;]+);`).exec(block);
	if (match?.[1] === undefined) throw new Error(`missing ${name}`);
	return parseColor(match[1]);
}

/** Every fixture, mode, and role with its emitted solid colours and diagnostics. */
function everyRole() {
	return Object.entries(FIXTURES).flatMap(([fixture, input]) => {
		const { css, diagnostics } = compileTheme(normalizeTheme(input));
		const blocks = splitBlocks(css);
		return MODES.flatMap((mode) => {
			const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
			return SEMANTIC_ROLES.map((role) => {
				const solid = (state: string) => {
					return value(block, `--luke-color-background-${role}-solid-${state}`);
				};
				return {
					diagnostics: diagnostics[mode].families[role],
					fixture,
					mode,
					onSolid: value(block, `--luke-color-foreground-${role}-on-solid`),
					pressed: solid('pressed'),
					hover: solid('hover'),
					rest: solid('rest'),
					role,
				};
			});
		});
	});
}

describe('solid hover and pressed states in every fixture', () => {
	it('clear both visibility floors on the emitted fills, in every mode', () => {
		for (const entry of everyRole()) {
			expect(
				oklabDeltaE(entry.rest, entry.hover),
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBeGreaterThanOrEqual(INTERACTION_HOVER_VISIBILITY);
			expect(
				oklabDeltaE(entry.hover, entry.pressed),
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBeGreaterThanOrEqual(INTERACTION_HOVER_TO_PRESSED_VISIBILITY);
		}
	});

	it('keep the on-solid text at 4.5:1 over all three emitted states', () => {
		for (const entry of everyRole()) {
			for (const state of [entry.rest, entry.hover, entry.pressed]) {
				expect(
					contrastRatio(entry.onSolid, state),
					`${entry.fixture} ${entry.mode} ${entry.role}`,
				).toBeGreaterThanOrEqual(TEXT_RATIO);
			}
		}
	});

	it('step away from the emitted on-solid text, so direction and text polarity agree', () => {
		for (const entry of everyRole()) {
			const textIsDark = entry.onSolid.l < 0.5;
			const sign = textIsDark ? 1 : -1;
			expect(
				sign * (entry.hover.l - entry.rest.l),
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBeGreaterThan(0);
			expect(
				sign * (entry.pressed.l - entry.hover.l),
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBeGreaterThan(0);
			expect(
				entry.diagnostics.solidStates.direction,
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBe(textIsDark ? 'lighter' : 'darker');
		}
	});

	it('are deterministic: compiling the same theme twice emits the same stylesheet', () => {
		for (const [fixture, input] of Object.entries(FIXTURES)) {
			expect(compileTheme(normalizeTheme(input)).css, `fixture ${fixture}`).toBe(
				compileTheme(normalizeTheme(input)).css,
			);
		}
	});

	it('keep every resting solid inside the ±0.035 window and report its distance to the edge', () => {
		for (const entry of everyRole()) {
			const { solidAnchor, source } = entry.diagnostics;
			expect(
				solidAnchor.distanceToEdge,
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBeGreaterThanOrEqual(0);
			if (entry.role === 'neutral') continue;
			expect(
				Math.abs(solidAnchor.resolvedLightness - source.l),
				`${entry.fixture} ${entry.mode} ${entry.role}`,
			).toBeLessThanOrEqual(0.035 + 1e-9);
		}
	});

	it('generates every fixture, including the chromatic sources that need the full window', () => {
		const chromatic = everyRole().filter((entry) => entry.fixture === 'chromatic');
		expect(chromatic).toHaveLength(MODES.length * SEMANTIC_ROLES.length);
	});
});
