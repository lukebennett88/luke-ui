import { describe, expect, it } from 'vite-plus/test';
import { paperFoundation, resolvedColor, tactileFoundation } from './__fixtures__/theme-css.js';
import { buildTheme, compileTheme, ThemeContrastError } from './build-theme.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { ThemeFoundation } from './foundation.js';

describe('buildTheme contrast failures', () => {
	function buildFailures(foundation: ThemeFoundation): ThemeContrastError {
		const caught = (() => {
			try {
				buildTheme(foundation);
				return null;
			} catch (error) {
				return error;
			}
		})();
		if (caught instanceof ThemeContrastError) return caught;
		throw new Error('expected buildTheme to throw ThemeContrastError');
	}

	it('rejects a low-contrast focus colour, naming mode, pair, and required ratio', () => {
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: resolvedColor('#c5d9ff') },
			},
			name: 'bad-focus',
		});
		const failure = error.failures.find((candidate) => {
			return (
				candidate.foreground === 'color.border.focus' &&
				candidate.background === 'color.surface.canvas'
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.mode).toBe('light');
		expect(failure?.required).toBe(3);
		expect(failure?.ratio).toBeLessThan(3);
		expect(error.message).toMatch(
			/light: color\.border\.focus on color\.surface\.canvas — \d+\.\d\d:1 < 3:1/,
		);
	});

	it('rejects a pathological dark-mode canvas the fixed text anchors cannot clear', () => {
		// v2 pins text lightness (neutral steps 11/12) per mode, so an unworkable neutral character no
		// longer produces low-contrast text; the honest failure mode is instead a canvas whose lightness
		// leaves the fixed text anchors below AA. A near-white dark canvas does exactly that.
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: resolvedColor('oklch(0.9 0 0)') },
			},
			name: 'bad-dark-canvas',
		});
		const failure = error.failures.find((candidate) => {
			return (
				candidate.mode === 'dark' &&
				candidate.foreground === 'color.text.primary' &&
				candidate.background.startsWith('color.surface.')
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.required).toBe(4.5);
		expect(error.message).toContain('dark: color.text.primary on color.surface.canvas');
	});

	it('aggregates every failing pair into one error', () => {
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: resolvedColor('oklch(0.9 0 0)') },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: resolvedColor('#c5d9ff') },
			},
			name: 'bad-both',
		});
		const foregrounds = new Set(error.failures.map((failure) => failure.foreground));
		// A low-contrast light focus ring and a pathological dark canvas fail different pairs across both
		// modes; the error collects them all.
		expect(foregrounds.has('color.border.focus')).toBe(true);
		expect(foregrounds.has('color.text.primary')).toBe(true);
		expect(error.failures.length).toBeGreaterThan(2);
		expect(error.message.split('\n').length).toBe(error.failures.length + 1);
	});
});

describe('contrast validation matrix', () => {
	// The matrix is role-uniform by construction: each role contributes the same per-role hard
	// and advisory counts below, plus a handful of hard checks that aren't per-role at all (see
	// `validateContrast`). Deriving the totals from those pieces means adding a role, or changing
	// a per-role count, updates the expectation automatically instead of needing a hand-edited
	// number.
	const PER_ROLE_HARD_HOVER = 5;
	const PER_ROLE_HARD_ON_SOLID = 3;
	const PER_ROLE_HARD_PRESSED = 5;
	const PER_ROLE_HARD_REST = 5;
	const PER_ROLE_ADVISORY_BORDER = 2;

	// Hard checks `validateContrast` runs once, not per role: functional primary/secondary text
	// against the 4 elevation surfaces (8), the focus ring and `border.control` boundaries
	// against the 2 base surfaces (4), and `danger.solid.rest` against the 2 base surfaces (2).
	const NON_PER_ROLE_HARD_CHECKS = 8 + 4 + 2;

	const expectedHard =
		SEMANTIC_ROLES.length *
			(PER_ROLE_HARD_HOVER + PER_ROLE_HARD_ON_SOLID + PER_ROLE_HARD_PRESSED + PER_ROLE_HARD_REST) +
		NON_PER_ROLE_HARD_CHECKS;
	const expectedAdvisory = SEMANTIC_ROLES.length * PER_ROLE_ADVISORY_BORDER;

	for (const foundation of [tactileFoundation, paperFoundation]) {
		it(`measures ${expectedHard} hard and ${expectedAdvisory} advisory checks per mode for ${foundation.name}, the same for every role`, () => {
			// `compileTheme` returns only once every hard gate passed, so reaching these assertions is
			// itself the proof that all hard checks pass for the bundled theme.
			const { diagnostics } = compileTheme(foundation);
			const summary = (['light', 'dark'] as const).map((mode) => {
				const checks = diagnostics[mode].contrastChecks;
				const countFor = (foreground: string, hard: boolean) => {
					return checks.filter((check) => check.hard === hard && check.foreground === foreground)
						.length;
				};
				return {
					advisory: checks.filter((check) => !check.hard).length,
					hard: checks.filter((check) => check.hard).length,
					mode,
					perRole: SEMANTIC_ROLES.map((role) => ({
						advisoryBorder: countFor(`color.border.${role}`, false),
						hardHover: countFor(`color.foreground.${role}.hover`, true),
						hardOnSolid: countFor(`color.foreground.${role}.onSolid`, true),
						hardPressed: countFor(`color.foreground.${role}.pressed`, true),
						hardRest: countFor(`color.foreground.${role}.rest`, true),
						role,
					})),
				};
			});
			expect(summary).toEqual(
				(['light', 'dark'] as const).map((mode) => ({
					advisory: expectedAdvisory,
					hard: expectedHard,
					mode,
					perRole: SEMANTIC_ROLES.map((role) => ({
						advisoryBorder: PER_ROLE_ADVISORY_BORDER,
						hardHover: PER_ROLE_HARD_HOVER,
						hardOnSolid: PER_ROLE_HARD_ON_SOLID,
						hardPressed: PER_ROLE_HARD_PRESSED,
						hardRest: PER_ROLE_HARD_REST,
						role,
					})),
				})),
			);
		});
	}

	it('records on each check whether missing its ratio fails the build', () => {
		// Every text pair is a hard gate, and so are the two solved boundaries `border.focus` and
		// `border.control`, plus `danger.solid.rest` vs the base surfaces (the only role fill gated —
		// see `validateContrast` for why the other five roles are not). The six semantic borders are the
		// only advisory checks. `color.border.decorative` is not measured. The "Theme/Diagnostics"
		// inspector uses this flag instead of matching token paths.
		const { diagnostics } = compileTheme(tactileFoundation);
		const advisoryBorders = SEMANTIC_ROLES.map((role) => `color.border.${role}`);
		const summary = (['light', 'dark'] as const).map((mode) => {
			const checks = diagnostics[mode].contrastChecks;
			const advisory = checks.filter((check) => !check.hard);
			const hard = checks.filter((check) => check.hard);
			return {
				advisoryForegrounds: [...new Set(advisory.map((check) => check.foreground))].sort(),
				// A hard gate that missed its ratio would throw before `compileTheme` returns. A recorded
				// hard check that does not pass means the flag disagrees with the compiler.
				everyHardGatePasses: hard.every((check) => check.passes),
				hardBoundaryForegrounds: [
					...new Set(hard.filter((check) => check.required === 3).map((check) => check.foreground)),
				].sort(),
				hardRatios: [...new Set(hard.map((check) => check.required))].sort((a, b) => a - b),
				mode,
				partitionsEveryCheck: hard.length + advisory.length === checks.length,
			};
		});
		expect(summary).toEqual(
			(['light', 'dark'] as const).map((mode) => ({
				advisoryForegrounds: [...advisoryBorders].sort(),
				everyHardGatePasses: true,
				hardBoundaryForegrounds: [
					'color.background.danger.solid.rest',
					'color.border.control',
					'color.border.focus',
				].sort(),
				hardRatios: [3, 4.5],
				mode,
				partitionsEveryCheck: true,
			})),
		);
	});
});
